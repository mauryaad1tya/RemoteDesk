import { io, Socket } from 'socket.io-client';
import { SocketEvents, Task, TaskStatus } from '@remotedesk/shared';
import { agentConfig } from '../config/index.js';
import { collectSystemMetrics } from '../system/index.js';
import { TaskExecutor } from '../tasks/index.js';
import pino from 'pino';

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: { colorize: true, ignore: 'pid,hostname', translateTime: 'SYS:standard' },
  },
});

export class AgentCommunication {
  private socket: Socket | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private metricsTimer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private retryAttempts: number = 0;

  constructor(
    private deviceId: string = agentConfig.AGENT_DEVICE_ID,
    private secretKey: string = agentConfig.AGENT_SECRET_KEY,
    private serverUrl: string = agentConfig.AGENT_API_URL
  ) {}

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    if (!this.deviceId || !this.secretKey) {
      logger.error('Cannot start agent: AGENT_DEVICE_ID or AGENT_SECRET_KEY is missing.');
      logger.info('Please enroll this laptop via the RemoteDesk dashboard first to obtain credentials.');
      return;
    }

    logger.info({ serverUrl: this.serverUrl, deviceId: this.deviceId }, 'Initializing RemoteDesk Agent connection...');
    this.connect();
  }

  private connect(): void {
    if (!this.isRunning) return;

    this.socket = io(this.serverUrl, {
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 30000,
      randomizationFactor: 0.5,
      timeout: 10000,
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      logger.info('Connected to RemoteDesk server. Performing authentication handshake...');
      this.retryAttempts = 0;

      // 1. Send Agent Authentication
      this.socket?.emit(
        SocketEvents.AGENT_AUTH,
        {
          deviceId: this.deviceId,
          secretKey: this.secretKey,
          agentVersion: agentConfig.AGENT_VERSION,
        },
        (response: { success: boolean; error?: string }) => {
          if (response && response.success) {
            logger.info('Agent authenticated successfully! Status: ONLINE');
            this.startHeartbeatLoop();
            this.startMetricsLoop();
          } else {
            logger.error({ error: response?.error }, 'Agent authentication rejected by server');
          }
        }
      );
    });

    // 2. Listen for Server-Dispatched Tasks
    this.socket.on(SocketEvents.TASK_EXECUTE, async (task: Task) => {
      logger.info({ taskId: task.id, operation: task.operationType }, 'Received task for execution');

      await TaskExecutor.execute(task, update => {
        logger.debug({ taskId: update.taskId, status: update.status }, 'Sending task update to server');
        this.socket?.emit(SocketEvents.AGENT_TASK_UPDATE, update);
      });
    });

    // 3. Listen for Task Cancellation
    this.socket.on(SocketEvents.TASK_CANCEL, ({ taskId }: { taskId: string }) => {
      logger.info({ taskId }, 'Received task cancellation signal');
      TaskExecutor.cancel(taskId);
    });

    this.socket.on('disconnect', (reason: string) => {
      logger.warn({ reason }, 'Disconnected from RemoteDesk server');
      this.stopLoops();
    });

    this.socket.on('connect_error', (err: Error) => {
      this.retryAttempts++;
      const jitterMs = Math.floor(Math.random() * 1000);
      const delayMs = Math.min(1000 * Math.pow(1.5, this.retryAttempts), 30000) + jitterMs;
      logger.warn({ error: err.message, retryInMs: Math.round(delayMs) }, 'Connection error, backing off...');
    });
  }

  private startHeartbeatLoop(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);

    this.heartbeatTimer = setInterval(() => {
      if (!this.socket || !this.socket.connected) return;

      this.socket.emit(SocketEvents.AGENT_HEARTBEAT, {
        deviceId: this.deviceId,
        timestamp: new Date().toISOString(),
        status: 'ONLINE',
        uptimeSeconds: process.uptime(),
      });
    }, agentConfig.AGENT_HEARTBEAT_INTERVAL_MS);
  }

  private startMetricsLoop(): void {
    if (this.metricsTimer) clearInterval(this.metricsTimer);

    // Initial immediate collection
    this.collectAndSendMetrics();

    this.metricsTimer = setInterval(() => {
      this.collectAndSendMetrics();
    }, agentConfig.AGENT_METRIC_INTERVAL_MS);
  }

  private async collectAndSendMetrics(): Promise<void> {
    if (!this.socket || !this.socket.connected) return;

    try {
      const metrics = await collectSystemMetrics(this.deviceId);
      this.socket.emit(SocketEvents.AGENT_METRICS, metrics);
    } catch (err: any) {
      logger.error({ error: err.message }, 'Failed to collect or send metrics');
    }
  }

  private stopLoops(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
      this.metricsTimer = null;
    }
  }

  public stop(): void {
    this.isRunning = false;
    this.stopLoops();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    logger.info('RemoteDesk Agent stopped.');
  }
}
