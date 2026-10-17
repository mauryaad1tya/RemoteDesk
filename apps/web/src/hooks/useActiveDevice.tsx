import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api.js';
import { socketService } from '../services/socket.js';
import { Device, SystemMetrics, DeviceStatus } from '@remotedesk/shared';

interface DeviceContextType {
  devices: Device[];
  activeDevice: Device | null;
  activeDeviceId: string | null;
  setActiveDeviceId: (id: string) => void;
  isOnline: boolean;
  latestMetrics: SystemMetrics | null;
  isLoading: boolean;
  refetchDevices: () => void;
}

const DeviceContext = createContext<DeviceContextType | null>(null);

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [activeDeviceId, setActiveDeviceIdState] = useState<string | null>(
    localStorage.getItem('remotedesk_active_device') || null
  );
  const [liveMetrics, setLiveMetrics] = useState<SystemMetrics | null>(null);

  const { data: devices = [], isLoading, refetch } = useQuery({
    queryKey: ['devices'],
    queryFn: () => api.getDevices(),
    refetchInterval: 15000,
  });

  // Ensure activeDeviceId is valid
  useEffect(() => {
    if (devices.length > 0) {
      if (!activeDeviceId || !devices.find(d => d.id === activeDeviceId)) {
        setActiveDeviceIdState(devices[0].id);
        localStorage.setItem('remotedesk_active_device', devices[0].id);
      }
    }
  }, [devices, activeDeviceId]);

  const setActiveDeviceId = (id: string) => {
    setActiveDeviceIdState(id);
    localStorage.setItem('remotedesk_active_device', id);
    setLiveMetrics(null);
  };

  const activeDevice = devices.find(d => d.id === activeDeviceId) || null;

  // Query latest metrics when active device changes
  const { data: initialMetrics } = useQuery({
    queryKey: ['metrics', activeDeviceId],
    queryFn: () => (activeDeviceId ? api.getLatestMetrics(activeDeviceId) : null),
    enabled: !!activeDeviceId,
  });

  useEffect(() => {
    if (initialMetrics) {
      setLiveMetrics(initialMetrics);
    }
  }, [initialMetrics]);

  // Connect WebSocket and listen for live updates
  useEffect(() => {
    const socket = socketService.connect();

    if (activeDeviceId) {
      socketService.subscribeDevice(activeDeviceId);
    }

    const unsubStatus = socketService.onDeviceStatusChanged(data => {
      queryClient.setQueryData(['devices'], (old: Device[] | undefined) => {
        if (!old) return old;
        return old.map(d =>
          d.id === data.deviceId
            ? { ...d, status: data.status as any, lastSeenAt: data.lastSeenAt, isOnline: data.status === 'ONLINE' }
            : d
        );
      });
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    });

    const unsubMetrics = socketService.onMetricsUpdated((metrics: SystemMetrics) => {
      if (metrics.deviceId === activeDeviceId) {
        setLiveMetrics(metrics);
      }
    });

    return () => {
      unsubStatus();
      unsubMetrics();
      if (activeDeviceId) {
        socketService.unsubscribeDevice(activeDeviceId);
      }
    };
  }, [activeDeviceId, queryClient]);

  const isOnline = activeDevice ? (activeDevice as any).isOnline || activeDevice.status === DeviceStatus.ONLINE : false;

  return (
    <DeviceContext.Provider
      value={{
        devices,
        activeDevice,
        activeDeviceId,
        setActiveDeviceId,
        isOnline,
        latestMetrics: liveMetrics,
        isLoading,
        refetchDevices: refetch,
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
}

export function useActiveDevice() {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useActiveDevice must be used within a DeviceProvider');
  }
  return context;
}
