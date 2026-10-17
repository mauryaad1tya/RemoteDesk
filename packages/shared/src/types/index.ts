import { DeviceStatusType, TaskStatusType, TaskOperationType, NotificationSeverityType } from '../constants/index.js';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface Device {
  id: string;
  displayName: string;
  hostname: string;
  osName: string;
  osVersion: string;
  arch: string;
  agentVersion: string;
  status: DeviceStatusType;
  lastSeenAt: string | null;
  heartbeatAt: string | null;
  ipAddress?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceCredentials {
  deviceId: string;
  secretHash: string;
  enrollmentToken?: string | null;
  revokedAt?: string | null;
}

export interface CpuMetrics {
  currentLoad: number;
  cores: number;
  model: string;
  speed: number;
}

export interface MemoryMetrics {
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  usedPercent: number;
}

export interface DiskMetrics {
  fs: string;
  type: string;
  sizeBytes: number;
  usedBytes: number;
  availableBytes: number;
  usedPercent: number;
  mount: string;
}

export interface BatteryMetrics {
  hasBattery: boolean;
  isCharging: boolean;
  percent: number;
  acConnected: boolean;
}

export interface SystemMetrics {
  id?: string;
  deviceId: string;
  timestamp: string;
  cpu: CpuMetrics;
  memory: MemoryMetrics;
  disks: DiskMetrics[];
  battery: BatteryMetrics;
  uptimeSeconds: number;
  network?: {
    interface: string;
    ip4: string;
    bytesReceived: number;
    bytesSent: number;
  }[];
}

export interface Task {
  id: string;
  deviceId: string;
  operationType: TaskOperationType;
  status: TaskStatusType;
  parameters: Record<string, any>;
  result?: Record<string, any> | null;
  errorMessage?: string | null;
  progressPercent?: number | null;
  idempotencyKey?: string | null;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  deviceId?: string | null;
  action: string;
  details?: Record<string, any> | null;
  ipAddress?: string | null;
  status: 'SUCCESS' | 'FAILURE';
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  severity: NotificationSeverityType;
  read: boolean;
  metadata?: Record<string, any> | null;
  createdAt: string;
}

export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  sizeBytes: number;
  modifiedAt: string;
  extension?: string;
}

export interface ApplicationItem {
  id: string;
  name: string;
  description: string;
  executablePath: string;
  iconName?: string;
  requiresAdmin: boolean;
  isEnabled: boolean;
}

export interface AllowedOperation {
  id: string;
  name: string;
  description: string;
  timeoutSeconds: number;
  requiresConfirmation: boolean;
  category: 'SYSTEM' | 'NETWORK' | 'MAINTENANCE' | 'DIAGNOSTIC';
}

export interface AppSettings {
  heartbeatIntervalSec: number;
  metricsIntervalSec: number;
  permittedRoots: string[];
  theme: 'dark' | 'light' | 'system';
  remoteDesktopUrl?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  requestId: string;
}
