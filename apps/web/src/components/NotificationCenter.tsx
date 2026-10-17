import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api.js';
import { Bell, CheckCheck, Info, CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';
import { NotificationItem } from '@remotedesk/shared';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.getNotifications(),
    refetchInterval: 10000,
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markOneMutation = useMutation({
    mutationFn: (id: string) => api.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (severity: string) => {
    switch (severity) {
      case 'SUCCESS':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'ERROR':
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-16 md:pr-8 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-surface-850 border border-slate-700/70 rounded-xl shadow-2xl overflow-hidden text-slate-100">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/60 bg-surface-900/50">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-brand-400" />
            <span className="font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-semibold rounded-full bg-brand-500/20 text-brand-300">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => markAllMutation.mutate()}
                className="text-xs text-slate-400 hover:text-brand-300 flex items-center gap-1 transition"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/80">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No notifications yet</div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => !n.read && markOneMutation.mutate(n.id)}
                className={`p-3 text-xs flex gap-3 transition cursor-pointer ${
                  n.read ? 'opacity-70 bg-surface-850' : 'bg-surface-800/40 hover:bg-surface-800'
                }`}
              >
                <div className="mt-0.5 shrink-0">{getIcon(n.severity)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-200 truncate">{n.title}</p>
                    <span className="text-[10px] text-slate-500">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
