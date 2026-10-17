import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import { io as ClientSocket } from 'socket.io-client';
import { createApp } from '../src/app.js';
import { initWebSocketServer } from '../src/websocket/server.js';
import { runMigrations } from '../src/database/migrate.js';
import { runSeeds } from '../src/database/seed.js';
import { closeDatabase } from '../src/database/db.js';
import { DeviceRepository } from '../src/repositories/device.repository.js';
import { TaskRepository } from '../src/repositories/task.repository.js';
import { AuditRepository } from '../src/repositories/audit.repository.js';
import { SocketEvents, TaskOperationType, TaskStatus } from '@remotedesk/shared';

describe('End-to-End Integration Flow', () => {
  let server: http.Server;
  let serverUrl: string;
  let testDeviceId: string;
  let testSecretKey: string;
  let agentSocket: any;

  beforeAll(async () => {
    runMigrations();
    runSeeds();

    const app = createApp();
    server = http.createServer(app);
    initWebSocketServer(server);

    await new Promise<void>(resolve => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        serverUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });

    // 1. Enroll test device
    const { device, secretKey } = DeviceRepository.createDevice({
      displayName: 'E2E Test Laptop',
      hostname: 'E2E-WIN-HOST',
      osName: 'Windows 11',
      osVersion: '10.0.26100',
      arch: 'x64',
      agentVersion: '1.0.0',
    });

    testDeviceId = device.id;
    testSecretKey = secretKey;
  });

  afterAll(() => {
    if (agentSocket) {
      agentSocket.disconnect();
    }
    server.close();
    closeDatabase();
  });

  it('Agent connects, authenticates via Socket.IO, and device becomes ONLINE', async () => {
    agentSocket = ClientSocket(serverUrl, {
      transports: ['websocket'],
    });

    const authResult = await new Promise<any>((resolve, reject) => {
      agentSocket.on('connect', () => {
        agentSocket.emit(
          SocketEvents.AGENT_AUTH,
          {
            deviceId: testDeviceId,
            secretKey: testSecretKey,
            agentVersion: '1.0.0',
          },
          (res: any) => resolve(res)
        );
      });
      agentSocket.on('connect_error', (err: any) => reject(err));
    });

    expect(authResult.success).toBe(true);

    const device = DeviceRepository.getDeviceById(testDeviceId);
    expect(device?.status).toBe('ONLINE');
  });

  it('Agent sends real-time system metrics and updates database/stream', async () => {
    const reportPromise = new Promise<any>(resolve => {
      agentSocket.emit(
        SocketEvents.AGENT_METRICS,
        {
          deviceId: testDeviceId,
          timestamp: new Date().toISOString(),
          cpu: { currentLoad: 14.5, cores: 8, model: 'Intel i7', speed: 2800 },
          memory: { totalBytes: 16000000000, usedBytes: 8000000000, freeBytes: 8000000000, usedPercent: 50 },
          disks: [{ fs: 'C:', type: 'NTFS', sizeBytes: 500000000000, usedBytes: 250000000000, availableBytes: 250000000000, usedPercent: 50, mount: 'C:' }],
          battery: { hasBattery: true, isCharging: true, percent: 92, acConnected: true },
          uptimeSeconds: 3600,
        },
        (ack: any) => resolve(ack)
      );
    });

    const ack = await reportPromise;
    expect(ack.success).toBe(true);
  });

  it('Server dispatches a task to agent, agent processes it, and reports completion', async () => {
    const task = TaskRepository.createTask({
      deviceId: testDeviceId,
      operationType: TaskOperationType.SYSTEM_INFO,
      parameters: {},
    });

    const taskReceivedPromise = new Promise<any>(resolve => {
      agentSocket.on(SocketEvents.TASK_EXECUTE, (receivedTask: any) => {
        resolve(receivedTask);
      });
    });

    // Dispatch from server
    const { dispatchTaskToAgent } = await import('../src/websocket/server.js');
    dispatchTaskToAgent(testDeviceId, task);

    const received = await taskReceivedPromise;
    expect(received.id).toBe(task.id);

    // Agent reports completion
    const updatePromise = new Promise<any>(resolve => {
      agentSocket.emit(
        SocketEvents.AGENT_TASK_UPDATE,
        {
          taskId: task.id,
          deviceId: testDeviceId,
          status: TaskStatus.COMPLETED,
          progressPercent: 100,
          result: { os: 'Windows 11', simulated: true },
        },
        (ack: any) => resolve(ack)
      );
    });

    const updateAck = await updatePromise;
    expect(updateAck.success).toBe(true);

    const completedTask = TaskRepository.getTaskById(task.id);
    expect(completedTask?.status).toBe(TaskStatus.COMPLETED);
    expect(completedTask?.result?.os).toBe('Windows 11');

    // Verify audit log was recorded
    const logs = AuditRepository.listLogs(10);
    const foundLog = logs.find(l => l.action === 'TASK_COMPLETED');
    expect(foundLog).toBeDefined();
  });
});
