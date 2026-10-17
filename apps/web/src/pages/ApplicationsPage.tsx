import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  PlaySquare,
  FileText,
  Calculator,
  Folder,
  Activity,
  Terminal,
  Play,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { useActiveDevice } from '../hooks/useActiveDevice.js';
import { api } from '../services/api.js';
import { ApplicationItem } from '@remotedesk/shared';

export function ApplicationsPage() {
  const { activeDeviceId, isOnline, refetchDevices } = useActiveDevice();
  const [lastLaunchResult, setLastLaunchResult] = useState<{
    appName: string;
    processId?: number;
    message: string;
    timestamp: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: apps = [], isLoading } = useQuery({
    queryKey: ['applications', activeDeviceId],
    queryFn: () => (activeDeviceId ? api.getApplications(activeDeviceId) : []),
    enabled: !!activeDeviceId,
  });

  const launchMutation = useMutation({
    mutationFn: ({ appId, appName }: { appId: string; appName: string }) =>
      api.launchApplication(activeDeviceId!, appId),
    onSuccess: (res, vars) => {
      setErrorMessage(null);
      setLastLaunchResult({
        appName: vars.appName,
        processId: res.processId,
        message: res.message,
        timestamp: new Date().toLocaleTimeString(),
      });
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to launch application');
    },
  });

  const getAppIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Calculator':
        return <Calculator className="w-6 h-6 text-emerald-400" />;
      case 'Folder':
        return <Folder className="w-6 h-6 text-amber-400" />;
      case 'Activity':
        return <Activity className="w-6 h-6 text-rose-400" />;
      case 'Terminal':
        return <Terminal className="w-6 h-6 text-indigo-400" />;
      case 'FileText':
      default:
        return <FileText className="w-6 h-6 text-brand-400" />;
    }
  };

  if (!isOnline) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 bg-surface-900 border border-slate-800 rounded-2xl">
        <PlaySquare className="w-12 h-12 text-slate-600 mb-3" />
        <h2 className="text-base font-bold text-slate-200">Device is Offline</h2>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mb-4">
          Cannot launch applications while the laptop is offline. Please make sure the agent is connected.
        </p>
        <button
          onClick={() => refetchDevices()}
          className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-brand-900/30 transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Check Status Again</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Approved Application Launcher</h1>
        <p className="text-xs text-slate-400 mt-1">
          Launch pre-approved Windows programs remotely on your laptop without typing raw commands.
        </p>
      </div>

      {/* Launch Feedback Banner */}
      {lastLaunchResult && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-semibold text-slate-100">
                Launched {lastLaunchResult.appName} (PID: {lastLaunchResult.processId || 'Assigned'})
              </p>
              <p className="text-emerald-400/80 text-[11px] mt-0.5">
                {lastLaunchResult.message} • {lastLaunchResult.timestamp}
              </p>
            </div>
          </div>
          <button
            onClick={() => setLastLaunchResult(null)}
            className="text-slate-400 hover:text-slate-200 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-slate-400 hover:text-slate-200">
            ✕
          </button>
        </div>
      )}

      {/* Security Note */}
      <div className="p-4 rounded-xl bg-surface-900 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-200">Security Policy:</strong> RemoteDesk only allows starting binaries that match the owner-configured server allowlist. Applications run under standard user permissions without deceptive elevation.
        </p>
      </div>

      {/* App Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {apps.map(app => (
          <div
            key={app.id}
            className="bg-surface-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition group"
          >
            <div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-surface-850 flex items-center justify-center shrink-0 border border-slate-800 group-hover:scale-105 transition-transform">
                  {getAppIcon(app.iconName)}
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-white">{app.name}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">{app.description}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 font-mono text-[11px] text-slate-500">
                Executable: <span className="text-slate-400">{app.executablePath}</span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Normal user session</span>
              </span>

              <button
                onClick={() => launchMutation.mutate({ appId: app.id, appName: app.name })}
                disabled={launchMutation.isPending || !app.isEnabled}
                className="px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-brand-900/30 transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Launch</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
