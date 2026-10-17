export const DeviceStatus = {
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
  CONNECTING: 'CONNECTING',
  RECONNECTING: 'RECONNECTING',
  UNAUTHORIZED: 'UNAUTHORIZED',
  ERROR: 'ERROR',
} as const;

export type DeviceStatusType = typeof DeviceStatus[keyof typeof DeviceStatus];

export const TaskStatus = {
  PENDING: 'PENDING',
  QUEUED: 'QUEUED',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  TIMED_OUT: 'TIMED_OUT',
} as const;

export type TaskStatusType = typeof TaskStatus[keyof typeof TaskStatus];

export const TaskOperationType = {
  SYSTEM_INFO: 'SYSTEM_INFO',
  LIST_PROCESSES: 'LIST_PROCESSES',
  DISK_USAGE: 'DISK_USAGE',
  NETWORK_CONNECTIVITY: 'NETWORK_CONNECTIVITY',
  READ_APPROVED_LOG: 'READ_APPROVED_LOG',
  RUN_MAINTENANCE_SCRIPT: 'RUN_MAINTENANCE_SCRIPT',
  APP_LAUNCH: 'APP_LAUNCH',
  SCREENSHOT: 'SCREENSHOT',
  FILE_UPLOAD: 'FILE_UPLOAD',
  FILE_DOWNLOAD: 'FILE_DOWNLOAD',
  FILE_DELETE: 'FILE_DELETE',
  FILE_RENAME: 'FILE_RENAME',
  FILE_MKDIR: 'FILE_MKDIR',
  POWER_LOCK: 'POWER_LOCK',
  POWER_SLEEP: 'POWER_SLEEP',
  POWER_RESTART: 'POWER_RESTART',
  POWER_SHUTDOWN: 'POWER_SHUTDOWN',
} as const;

export type TaskOperationType = typeof TaskOperationType[keyof typeof TaskOperationType];

export const SocketEvents = {
  // Agent -> Server
  AGENT_AUTH: 'agent:auth',
  AGENT_HEARTBEAT: 'agent:heartbeat',
  AGENT_METRICS: 'agent:metrics',
  AGENT_TASK_UPDATE: 'agent:task:update',
  AGENT_DISCONNECT: 'agent:disconnect',

  // Server -> Agent
  TASK_EXECUTE: 'task:execute',
  TASK_CANCEL: 'task:cancel',

  // Client -> Server
  CLIENT_SUBSCRIBE_DEVICE: 'client:subscribe:device',
  CLIENT_UNSUBSCRIBE_DEVICE: 'client:unsubscribe:device',

  // Server -> Client
  DEVICE_STATUS_CHANGED: 'device:status:changed',
  METRICS_UPDATED: 'metrics:updated',
  TASK_UPDATED: 'task:updated',
  TASK_PROGRESS: 'task:progress',
  NOTIFICATION_NEW: 'notification:new',
} as const;

export const NotificationSeverity = {
  INFO: 'INFO',
  SUCCESS: 'SUCCESS',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
} as const;

export type NotificationSeverityType = typeof NotificationSeverity[keyof typeof NotificationSeverity];
