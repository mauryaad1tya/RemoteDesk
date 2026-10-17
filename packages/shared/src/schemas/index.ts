import { z } from 'zod';
import { TaskOperationType } from '../constants/index.js';

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const EnrollDeviceSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').max(64),
  hostname: z.string().min(1).max(128),
  osName: z.string().min(1).max(64),
  osVersion: z.string().min(1).max(64),
  arch: z.string().min(1).max(32),
  agentVersion: z.string().min(1).max(32),
});
export type EnrollDeviceInput = z.infer<typeof EnrollDeviceSchema>;

export const AgentAuthSchema = z.object({
  deviceId: z.string().uuid(),
  secretKey: z.string().min(16),
  agentVersion: z.string(),
});
export type AgentAuthInput = z.infer<typeof AgentAuthSchema>;

export const HeartbeatSchema = z.object({
  deviceId: z.string().uuid(),
  timestamp: z.string(),
  status: z.enum(['ONLINE', 'CONNECTING', 'RECONNECTING', 'ERROR']),
  uptimeSeconds: z.number().nonnegative(),
});
export type HeartbeatInput = z.infer<typeof HeartbeatSchema>;

export const MetricsReportSchema = z.object({
  deviceId: z.string().uuid(),
  timestamp: z.string(),
  cpu: z.object({
    currentLoad: z.number(),
    cores: z.number(),
    model: z.string(),
    speed: z.number(),
  }),
  memory: z.object({
    totalBytes: z.number(),
    usedBytes: z.number(),
    freeBytes: z.number(),
    usedPercent: z.number(),
  }),
  disks: z.array(z.object({
    fs: z.string(),
    type: z.string(),
    sizeBytes: z.number(),
    usedBytes: z.number(),
    availableBytes: z.number(),
    usedPercent: z.number(),
    mount: z.string(),
  })),
  battery: z.object({
    hasBattery: z.boolean(),
    isCharging: z.boolean(),
    percent: z.number(),
    acConnected: z.boolean(),
  }),
  uptimeSeconds: z.number(),
  network: z.array(z.object({
    interface: z.string(),
    ip4: z.string(),
    bytesReceived: z.number(),
    bytesSent: z.number(),
  })).optional(),
});
export type MetricsReportInput = z.infer<typeof MetricsReportSchema>;

export const CreateTaskSchema = z.object({
  operationType: z.nativeEnum(TaskOperationType),
  parameters: z.record(z.any()).default({}),
  idempotencyKey: z.string().optional(),
});
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

export const TaskUpdateSchema = z.object({
  taskId: z.string().uuid(),
  deviceId: z.string().uuid(),
  status: z.enum(['PENDING', 'QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'TIMED_OUT']),
  progressPercent: z.number().min(0).max(100).optional(),
  result: z.record(z.any()).optional().nullable(),
  errorMessage: z.string().optional().nullable(),
});
export type TaskUpdateInput = z.infer<typeof TaskUpdateSchema>;

export const BrowseFilesSchema = z.object({
  path: z.string().default(''),
});
export type BrowseFilesInput = z.infer<typeof BrowseFilesSchema>;

export const CreateFolderSchema = z.object({
  parentPath: z.string().min(1),
  name: z.string().min(1).max(255).regex(/^[^<>:"/\\|?*]+$/, 'Invalid folder name'),
});
export type CreateFolderInput = z.infer<typeof CreateFolderSchema>;

export const RenameFileSchema = z.object({
  currentPath: z.string().min(1),
  newName: z.string().min(1).max(255).regex(/^[^<>:"/\\|?*]+$/, 'Invalid file or folder name'),
});
export type RenameFileInput = z.infer<typeof RenameFileSchema>;

export const DeleteFileSchema = z.object({
  path: z.string().min(1),
});
export type DeleteFileInput = z.infer<typeof DeleteFileSchema>;

export const LaunchAppSchema = z.object({
  applicationId: z.string().min(1),
  args: z.array(z.string()).optional(),
});
export type LaunchAppInput = z.infer<typeof LaunchAppSchema>;

export const PowerActionSchema = z.object({
  action: z.enum(['LOCK', 'SLEEP', 'RESTART', 'SHUTDOWN']),
  confirm: z.boolean().refine(val => val === true, {
    message: 'Explicit confirmation is required for power operations',
  }),
});
export type PowerActionInput = z.infer<typeof PowerActionSchema>;

export const UpdateSettingsSchema = z.object({
  heartbeatIntervalSec: z.number().min(5).max(300).optional(),
  metricsIntervalSec: z.number().min(3).max(300).optional(),
  permittedRoots: z.array(z.string()).optional(),
  theme: z.enum(['dark', 'light', 'system']).optional(),
  remoteDesktopUrl: z.string().optional(),
});
export type UpdateSettingsInput = z.infer<typeof UpdateSettingsSchema>;
