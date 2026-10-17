import { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import {
  SocketEvents,
  DeviceStatus,
  TaskStatus,
  AgentAuthSchema,
  HeartbeatSchema,
  MetricsReportSchema,
  TaskUpdateSchema,
  Task,
} from '@remotedesk/shared';
import { DeviceRepository } from '../repositories/device.repository.js';
import { MetricsRepository } from '../repositories/metrics.repository.js';
import { TaskRepository } from '../repositories/task.repository.js';
import { AuditRepository } from '../repositories/audit.repository.js';
import { NotificationRepository } from '../repositories/notification.repository.js';
import { notifyTaskEvent } from '../utils/task-runner.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

let ioInstance: SocketIOServer | null = null;
const activeAgentSockets = new Map<string, Socket>();
const pendingDisconnectTimeouts = new Map<string, NodeJS.Timeout>();

export function getIO(): SocketIOServer {
  if (!ioInstance) {
    throw new Error('Socket.IO is not initialized yet');
  }
  return ioInstance;
}

export function isAgentConnected(deviceId: string): boolean {
  return activeAgentSockets.has(deviceId);
}

export function dispatchTaskToAgent(deviceId: string, task: Task): boolean {
  const agentSocket = activeAgentSockets.get(deviceId);
  if (!agentSocket || !agentSocket.connected) {
    logger.warn({ deviceId, taskId: task.id }, 'Cannot dispatch task: agent is offline');
    TaskRepository.updateTaskStatus(task.id, TaskStatus.FAILED, undefined, null, 'Agent is offline');
    return false;
  }

  logger.info({ deviceId, taskId: task.id, operation: task.operationType }, 'Dispatching task to agent');
  agentSocket.emit(SocketEvents.TASK_EXECUTE, task);
  TaskRepository.updateTaskStatus(task.id, TaskStatus.QUEUED);
  return true;
}

export function cancelTaskOnAgent(deviceId: string, taskId: string): boolean {
  const agentSocket = activeAgentSockets.get(deviceId);
  if (agentSocket && agentSocket.connected) {
    agentSocket.emit(SocketEvents.TASK_CANCEL, { taskId });
    return true;
  }
  return false;
}

export function initWebSocketServer(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: [env.CORS_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  io.on('connection', (socket: Socket) => {
    logger.debug({ socketId: socket.id }, 'WebSocket connection established');

    let authenticatedDeviceId: string | null = null;

    // 1. Agent Authentication Handshake
    socket.on(SocketEvents.AGENT_AUTH, async (payload: unknown, ack?: (res: any) => void) => {
      try {
        const parsed = AgentAuthSchema.safeParse(payload);
        if (!parsed.success) {
          logger.warn({ errors: parsed.error.format() }, 'Invalid agent auth payload');
          if (ack) ack({ success: false, error: 'Invalid authentication payload' });
          socket.disconnect();
          return;
        }

        const { deviceId, secretKey } = parsed.data;
        const isValid = DeviceRepository.verifyCredentials(deviceId, secretKey);

        if (!isValid) {
          logger.warn({ deviceId }, 'Agent authentication failed: invalid credentials or revoked');
          AuditRepository.record({
            deviceId,
            action: 'AGENT_AUTH_FAILED',
            details: { reason: 'Invalid credentials or revoked' },
            ipAddress: socket.handshake.address,
            status: 'FAILURE',
          });
          if (ack) ack({ success: false, error: 'Unauthorized device' });
          socket.disconnect();
          return;
        }

        // Clear any pending disconnect timeout
        const existingTimeout = pendingDisconnectTimeouts.get(deviceId);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
          pendingDisconnectTimeouts.delete(deviceId);
        }

        // Close previous socket if already connected
        const existingSocket = activeAgentSockets.get(deviceId);
        if (existingSocket && existingSocket.id !== socket.id) {
          logger.info({ deviceId }, 'Disconnecting duplicate agent socket connection');
          existingSocket.disconnect();
        }

        authenticatedDeviceId = deviceId;
        activeAgentSockets.set(deviceId, socket);

        DeviceRepository.updateDeviceStatus(deviceId, DeviceStatus.ONLINE, socket.handshake.address);
        DeviceRepository.updateHeartbeat(deviceId);

        AuditRepository.record({
          deviceId,
          action: 'AGENT_CONNECTED',
          ipAddress: socket.handshake.address,
          status: 'SUCCESS',
        });

        logger.info({ deviceId, socketId: socket.id }, 'Agent authenticated and online');

        // Broadcast status change to web clients
        io.emit(SocketEvents.DEVICE_STATUS_CHANGED, {
          deviceId,
          status: DeviceStatus.ONLINE,
          lastSeenAt: new Date().toISOString(),
        });

        if (ack) ack({ success: true, message: 'Authentication successful' });
      } catch (err: any) {
        logger.error({ err }, 'Error during agent authentication');
        if (ack) ack({ success: false, error: 'Server error' });
      }
    });

    // 2. Agent Heartbeat
    socket.on(SocketEvents.AGENT_HEARTBEAT, (payload: unknown, ack?: (res: any) => void) => {
      try {
        const parsed = HeartbeatSchema.safeParse(payload);
        if (!parsed.success) {
          if (ack) ack({ success: false, error: 'Invalid heartbeat payload' });
          return;
        }

        const { deviceId } = parsed.data;
        if (authenticatedDeviceId !== deviceId) {
          if (ack) ack({ success: false, error: 'Unauthenticated socket' });
          return;
        }

        DeviceRepository.updateHeartbeat(deviceId);
        if (ack) ack({ success: true, receivedAt: new Date().toISOString() });
      } catch (err) {
        logger.error({ err }, 'Error handling heartbeat');
      }
    });

    // 3. Agent Metrics Report
    socket.on(SocketEvents.AGENT_METRICS, (payload: unknown, ack?: (res: any) => void) => {
      try {
        const parsed = MetricsReportSchema.safeParse(payload);
        if (!parsed.success) {
          logger.warn({ errors: parsed.error.format() }, 'Invalid metrics report payload');
          if (ack) ack({ success: false, error: 'Invalid metrics' });
          return;
        }

        const metrics = parsed.data;
        if (authenticatedDeviceId !== metrics.deviceId) {
          if (ack) ack({ success: false, error: 'Unauthenticated socket' });
          return;
        }

        MetricsRepository.saveMetrics(metrics);

        // Broadcast live metrics to room subscribers
        io.to(`device:${metrics.deviceId}`).emit(SocketEvents.METRICS_UPDATED, metrics);

        if (ack) ack({ success: true });
      } catch (err) {
        logger.error({ err }, 'Error saving agent metrics');
      }
    });

    // 4. Agent Task Update (progress, status, completion)
    socket.on(SocketEvents.AGENT_TASK_UPDATE, (payload: unknown, ack?: (res: any) => void) => {
      try {
        const parsed = TaskUpdateSchema.safeParse(payload);
        if (!parsed.success) {
          logger.warn({ errors: parsed.error.format() }, 'Invalid task update payload');
          if (ack) ack({ success: false, error: 'Invalid task update' });
          return;
        }

        const { taskId, deviceId, status, progressPercent, result, errorMessage } = parsed.data;
        if (authenticatedDeviceId !== deviceId) {
          if (ack) ack({ success: false, error: 'Unauthenticated socket' });
          return;
        }

        const updatedTask = TaskRepository.updateTaskStatus(
          taskId,
          status,
          progressPercent,
          result,
          errorMessage
        );

        if (updatedTask) {
          notifyTaskEvent(updatedTask);
          io.to(`device:${deviceId}`).emit(SocketEvents.TASK_UPDATED, updatedTask);

          if (status === TaskStatus.COMPLETED || status === TaskStatus.FAILED) {
            AuditRepository.record({
              deviceId,
              action: `TASK_${status}`,
              details: { taskId, operationType: updatedTask.operationType, errorMessage },
              status: status === TaskStatus.COMPLETED ? 'SUCCESS' : 'FAILURE',
            });
          }
        }

        if (ack) ack({ success: true });
      } catch (err) {
        logger.error({ err }, 'Error processing task update');
      }
    });

    // 5. Client Room Subscriptions
    socket.on(SocketEvents.CLIENT_SUBSCRIBE_DEVICE, ({ deviceId }: { deviceId: string }) => {
      if (deviceId) {
        socket.join(`device:${deviceId}`);
        logger.debug({ socketId: socket.id, deviceId }, 'Client subscribed to device updates');
      }
    });

    socket.on(SocketEvents.CLIENT_UNSUBSCRIBE_DEVICE, ({ deviceId }: { deviceId: string }) => {
      if (deviceId) {
        socket.leave(`device:${deviceId}`);
        logger.debug({ socketId: socket.id, deviceId }, 'Client unsubscribed from device');
      }
    });

    // 6. Socket Disconnection
    socket.on('disconnect', () => {
      if (authenticatedDeviceId) {
        const deviceId = authenticatedDeviceId;
        logger.info({ deviceId, socketId: socket.id }, 'Agent socket disconnected');

        activeAgentSockets.delete(deviceId);

        // Schedule grace period (10 seconds) before declaring device offline
        const timeout = setTimeout(() => {
          pendingDisconnectTimeouts.delete(deviceId);

          // Verify if another connection reconnected in the meantime
          if (!activeAgentSockets.has(deviceId)) {
            DeviceRepository.updateDeviceStatus(deviceId, DeviceStatus.OFFLINE);
            io.emit(SocketEvents.DEVICE_STATUS_CHANGED, {
              deviceId,
              status: DeviceStatus.OFFLINE,
              lastSeenAt: new Date().toISOString(),
            });

            AuditRepository.record({
              deviceId,
              action: 'AGENT_DISCONNECTED',
              status: 'SUCCESS',
            });
            logger.info({ deviceId }, 'Marked device as OFFLINE after grace period');
          }
        }, 10000);

        pendingDisconnectTimeouts.set(deviceId, timeout);
      }
    });
  });

  // Background check for stale heartbeats every 15 seconds
  setInterval(() => {
    try {
      const staleDeviceIds = DeviceRepository.markStaleDevicesOffline(35000);
      for (const id of staleDeviceIds) {
        activeAgentSockets.delete(id);
        io.emit(SocketEvents.DEVICE_STATUS_CHANGED, {
          deviceId: id,
          status: DeviceStatus.OFFLINE,
          lastSeenAt: new Date().toISOString(),
        });
        logger.info({ deviceId: id }, 'Marked stale device as OFFLINE');
      }
    } catch (err) {
      logger.error({ err }, 'Error in stale heartbeat cleanup');
    }
  }, 15000);

  ioInstance = io;
  return io;
}
