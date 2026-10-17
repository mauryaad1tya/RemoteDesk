import {
  ApiResponse,
  Device,
  SystemMetrics,
  Task,
  AuditLog,
  NotificationItem,
  FileItem,
  ApplicationItem,
  AllowedOperation,
  AppSettings,
} from '@remotedesk/shared';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('remotedesk_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('remotedesk_token', token);
    } else {
      localStorage.removeItem('remotedesk_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}/api/v1${endpoint}`;
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    const data: ApiResponse<T> = await res.json().catch(() => ({
      success: false,
      error: { code: 'PARSE_ERROR', message: `Server returned HTTP ${res.status}` },
      requestId: 'unknown',
    }));

    if (!res.ok || !data.success) {
      const err = new Error(data.error?.message || `HTTP ${res.status}`);
      (err as any).code = data.error?.code;
      (err as any).status = res.status;
      throw err;
    }

    return data.data as T;
  }

  // --- Auth ---
  login(credentials: { email: string; password: string }) {
    return this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  logout() {
    return this.request<{ message: string }>('/auth/logout', { method: 'POST' });
  }

  getSession() {
    return this.request<{ user: any }>('/auth/session');
  }

  // --- Devices ---
  getDevices() {
    return this.request<Device[]>('/devices');
  }

  getDevice(id: string) {
    return this.request<Device & { isOnline: boolean; latestMetrics?: SystemMetrics }> (`/devices/${id}`);
  }

  enrollDevice(data: { displayName: string; hostname: string; osName: string; osVersion: string; arch: string; agentVersion: string }) {
    return this.request<{ device: Device; credentials: { deviceId: string; secretKey: string }; setupInstructions: string }>('/devices/enroll', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  revokeDevice(id: string) {
    return this.request<{ message: string }>(`/devices/${id}/revoke`, { method: 'POST' });
  }

  // --- Metrics ---
  getLatestMetrics(deviceId: string) {
    return this.request<SystemMetrics>(`/devices/${deviceId}/metrics`);
  }

  getMetricsHistory(deviceId: string, limit = 60) {
    return this.request<SystemMetrics[]>(`/devices/${deviceId}/metrics/history?limit=${limit}`);
  }

  // --- Files ---
  browseFiles(deviceId: string, path = '') {
    return this.request<{ currentPath: string; parentPath: string | null; items: FileItem[] }>(
      `/devices/${deviceId}/files?path=${encodeURIComponent(path)}`
    );
  }

  createFolder(deviceId: string, parentPath: string, name: string) {
    return this.request<{ success: boolean; createdPath: string }>(`/devices/${deviceId}/files/folder`, {
      method: 'POST',
      body: JSON.stringify({ parentPath, name }),
    });
  }

  renameFile(deviceId: string, currentPath: string, newName: string) {
    return this.request<{ success: boolean; newPath: string }>(`/devices/${deviceId}/files/rename`, {
      method: 'PATCH',
      body: JSON.stringify({ currentPath, newName }),
    });
  }

  deleteFile(deviceId: string, targetPath: string) {
    return this.request<{ success: boolean; deletedPath: string }>(`/devices/${deviceId}/files`, {
      method: 'DELETE',
      body: JSON.stringify({ path: targetPath }),
    });
  }

  uploadFile(deviceId: string, targetDir: string, file: File) {
    const formData = new FormData();
    formData.append('targetDir', targetDir);
    formData.append('file', file);
    return this.request<{ success: boolean; writtenPath: string; sizeBytes: number }>(`/devices/${deviceId}/files/upload`, {
      method: 'POST',
      body: formData,
    });
  }

  getDownloadUrl(deviceId: string, path: string): string {
    return `${API_BASE}/api/v1/devices/${deviceId}/files/download?path=${encodeURIComponent(path)}`;
  }

  // --- Applications ---
  getApplications(deviceId: string) {
    return this.request<ApplicationItem[]>(`/devices/${deviceId}/applications`);
  }

  launchApplication(deviceId: string, applicationId: string, args: string[] = []) {
    return this.request<{ success: boolean; processId?: number; message: string }>(
      `/devices/${deviceId}/applications/${applicationId}/launch`,
      {
        method: 'POST',
        body: JSON.stringify({ args }),
      }
    );
  }

  // --- Tasks ---
  getTasks(deviceId?: string) {
    return this.request<Task[]>(`/tasks${deviceId ? `?deviceId=${deviceId}` : ''}`);
  }

  getTask(id: string) {
    return this.request<Task>(`/tasks/${id}`);
  }

  createTask(deviceId: string, operationType: string, parameters: Record<string, any> = {}, idempotencyKey?: string) {
    return this.request<Task>(`/devices/${deviceId}/tasks`, {
      method: 'POST',
      body: JSON.stringify({ operationType, parameters, idempotencyKey }),
    });
  }

  cancelTask(id: string) {
    return this.request<Task>(`/tasks/${id}/cancel`, { method: 'POST' });
  }

  // --- Screenshots ---
  captureScreenshot(deviceId: string) {
    return this.request<{ screenshotId: string; url: string; width: number; height: number; capturedAt: string }>(
      `/devices/${deviceId}/screenshots`,
      { method: 'POST' }
    );
  }

  getScreenshotUrl(screenshotId: string) {
    return `${API_BASE}/api/v1/screenshots/${screenshotId}`;
  }

  // --- Power ---
  powerAction(deviceId: string, action: 'LOCK' | 'SLEEP' | 'RESTART' | 'SHUTDOWN') {
    return this.request<{ message: string }>(`/devices/${deviceId}/power/${action.toLowerCase()}`, {
      method: 'POST',
      body: JSON.stringify({ action, confirm: true }),
    });
  }

  // --- Activity & Notifications ---
  getActivity(limit = 100) {
    return this.request<AuditLog[]>(`/activity?limit=${limit}`);
  }

  getNotifications() {
    return this.request<NotificationItem[]>('/notifications');
  }

  markNotificationRead(id: string) {
    return this.request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PATCH' });
  }

  markAllNotificationsRead() {
    return this.request<{ markedCount: number }>('/notifications/read-all', { method: 'POST' });
  }

  // --- Settings ---
  getSettings() {
    return this.request<{ settings: AppSettings; applications: ApplicationItem[]; operations: AllowedOperation[] }>(
      '/settings'
    );
  }

  updateSettings(settings: Partial<AppSettings>) {
    return this.request<AppSettings>('/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  }
}

export const api = new ApiClient();
