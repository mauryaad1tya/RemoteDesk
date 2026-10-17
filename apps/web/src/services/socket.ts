import { io, Socket } from 'socket.io-client';
import { SocketEvents } from '@remotedesk/shared';

const WS_BASE = import.meta.env.VITE_WS_URL || 'http://localhost:4000';

class SocketService {
  private socket: Socket | null = null;
  private currentDeviceId: string | null = null;

  connect() {
    if (this.socket && this.socket.connected) return this.socket;

    this.socket = io(WS_BASE, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });

    this.socket.on('connect', () => {
      console.log('[RemoteDesk WS] Connected to live event stream');
      if (this.currentDeviceId) {
        this.subscribeDevice(this.currentDeviceId);
      }
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  subscribeDevice(deviceId: string) {
    this.currentDeviceId = deviceId;
    if (this.socket && this.socket.connected) {
      this.socket.emit(SocketEvents.CLIENT_SUBSCRIBE_DEVICE, { deviceId });
    }
  }

  unsubscribeDevice(deviceId: string) {
    if (this.currentDeviceId === deviceId) {
      this.currentDeviceId = null;
    }
    if (this.socket && this.socket.connected) {
      this.socket.emit(SocketEvents.CLIENT_UNSUBSCRIBE_DEVICE, { deviceId });
    }
  }

  onDeviceStatusChanged(callback: (data: { deviceId: string; status: string; lastSeenAt: string }) => void) {
    this.socket?.on(SocketEvents.DEVICE_STATUS_CHANGED, callback);
    return () => {
      this.socket?.off(SocketEvents.DEVICE_STATUS_CHANGED, callback);
    };
  }

  onMetricsUpdated(callback: (metrics: any) => void) {
    this.socket?.on(SocketEvents.METRICS_UPDATED, callback);
    return () => {
      this.socket?.off(SocketEvents.METRICS_UPDATED, callback);
    };
  }

  onTaskUpdated(callback: (task: any) => void) {
    this.socket?.on(SocketEvents.TASK_UPDATED, callback);
    return () => {
      this.socket?.off(SocketEvents.TASK_UPDATED, callback);
    };
  }

  onNotification(callback: (notification: any) => void) {
    this.socket?.on(SocketEvents.NOTIFICATION_NEW, callback);
    return () => {
      this.socket?.off(SocketEvents.NOTIFICATION_NEW, callback);
    };
  }
}

export const socketService = new SocketService();
