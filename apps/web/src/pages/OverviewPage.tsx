import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Laptop,
  Cpu,
  HardDrive,
  Battery,
  BatteryCharging,
  Clock,
  Camera,
  FolderTree,
  MonitorPlay,
  RotateCcw,
  Power,
  Lock,
  Moon,
  RefreshCw,
  ExternalLink,
  Shield,
  Layers,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { useActiveDevice } from '../hooks/useActiveDevice.js';
import { api } from '../services/api.js';
import { ConfirmModal } from '../components/ConfirmModal.js';

export function OverviewPage() {
  const navigate = useNavigate();
  const { activeDevice, activeDeviceId, isOnline, latestMetrics, refetchDevices } = useActiveDevice();

  const [confirmAction, setConfirmAction] = useState<'LOCK' | 'SLEEP' | 'RESTART' | 'SHUTDOWN' | null>(null);
  const [screenshotModal, setScreenshotModal] = useState<{ url: string; capturedAt: string } | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch recent metrics history for sparkline charts
  const { data: metricsHistory = [] } = useQuery({
    queryKey: ['metrics-history', activeDeviceId],
    queryFn: () => (activeDeviceId ? api.getMetricsHistory(activeDeviceId, 20) : []),
    enabled: !!activeDeviceId,
    refetchInterval: 10000,
  });

  const chartData = metricsHistory.map(m => ({
    time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    cpu: m.cpu.currentLoad,
    memory: m.memory.usedPercent,
  }));

  const handleCaptureScreenshot = async () => {
    if (!activeDeviceId) return;
    setIsCapturing(true);
    setActionMessage(null);
    try {
      const res = await api.captureScreenshot(activeDeviceId);
      setScreenshotModal({ url: res.url, capturedAt: res.capturedAt });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Screenshot capture failed' });
    } finally {
      setIsCapturing(false);
    }
  };

  const handlePowerAction = async () => {
    if (!activeDeviceId || !confirmAction) return;
    const action = confirmAction;
    setConfirmAction(null);
    setActionMessage(null);

    try {
      const res = await api.powerAction(activeDeviceId, action);
      setActionMessage({ type: 'success', text: res.message || `${action} request dispatched` });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || `Failed to execute ${action}` });
    }
  };

  if (!activeDevice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-surface-900 border border-slate-800 rounded-2xl">
        <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center mb-4">
          <Laptop className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-100">No Laptop Enrolled Yet</h2>
        <p className="text-xs text-slate-400 max-w-sm mt-1 mb-6">
          Enroll your Windows laptop to monitor hardware metrics, manage files, launch applications, and open remote desktop.
        </p>
        <button
          onClick={() => navigate('/devices')}
          className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs shadow-lg shadow-brand-900/30 transition cursor-pointer"
        >
          Enroll Windows Laptop
        </button>
      </div>
    );
  }

  const primaryDisk = latestMetrics?.disks?.[0];
  const uptimeHours = latestMetrics ? (latestMetrics.uptimeSeconds / 3600).toFixed(1) : '—';
  const memUsedGB = latestMetrics ? (latestMetrics.memory.usedBytes / (1024 * 1024 * 1024)).toFixed(1) : '0';
  const memTotalGB = latestMetrics ? (latestMetrics.memory.totalBytes / (1024 * 1024 * 1024)).toFixed(1) : '0';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Action Feedback */}
      {actionMessage && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
            actionMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="underline text-[11px] opacity-70 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* 1. Device Header Card */}
      <div className="bg-surface-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shrink-0 shadow-lg shadow-brand-500/20">
              <Laptop className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-white tracking-tight">{activeDevice.displayName}</h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    isOnline ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                <span>{activeDevice.osName} ({activeDevice.arch})</span>
                <span>•</span>
                <span>Host: {activeDevice.hostname}</span>
                <span>•</span>
                <span>Agent v{activeDevice.agentVersion}</span>
                {activeDevice.ipAddress && (
                  <>
                    <span>•</span>
                    <span>IP: {activeDevice.ipAddress}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => refetchDevices()}
              className="p-2.5 rounded-xl bg-surface-850 hover:bg-surface-800 border border-slate-700/80 text-slate-300 hover:text-white transition cursor-pointer text-xs flex items-center gap-1.5"
              title="Refresh status"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleCaptureScreenshot}
              disabled={!isOnline || isCapturing}
              className="px-3.5 py-2.5 rounded-xl bg-surface-850 hover:bg-surface-800 disabled:opacity-50 border border-slate-700/80 text-slate-200 hover:text-white transition cursor-pointer text-xs flex items-center gap-2"
            >
              <Camera className="w-4 h-4 text-brand-400" />
              <span>{isCapturing ? 'Capturing...' : 'Screenshot'}</span>
            </button>

            <button
              onClick={() => navigate('/remote-desktop')}
              className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-brand-900/30 transition cursor-pointer"
            >
              <MonitorPlay className="w-4 h-4" />
              <span>Remote Desktop</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU */}
        <div className="bg-surface-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">CPU Utilization</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {latestMetrics ? `${latestMetrics.cpu.currentLoad}%` : isOnline ? 'Loading...' : 'Unavailable'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 truncate">
              {latestMetrics ? `${latestMetrics.cpu.cores} Cores • ${latestMetrics.cpu.model}` : 'Windows Processor'}
            </p>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(latestMetrics?.cpu.currentLoad || 0, 100)}%` }}
            />
          </div>
        </div>

        {/* Memory */}
        <div className="bg-surface-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Memory Usage</span>
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {latestMetrics ? `${latestMetrics.memory.usedPercent}%` : isOnline ? 'Loading...' : 'Unavailable'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {memUsedGB} GB / {memTotalGB} GB Total
            </p>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-brand-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(latestMetrics?.memory.usedPercent || 0, 100)}%` }}
            />
          </div>
        </div>

        {/* Disk */}
        <div className="bg-surface-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Primary Storage</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {primaryDisk ? `${primaryDisk.usedPercent}%` : isOnline ? 'Checking...' : 'Unavailable'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {primaryDisk
                ? `${Math.round(primaryDisk.availableBytes / 1024 / 1024 / 1024)} GB Free (${primaryDisk.mount})`
                : 'Storage stats'}
            </p>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(primaryDisk?.usedPercent || 0, 100)}%` }}
            />
          </div>
        </div>

        {/* Battery & Uptime */}
        <div className="bg-surface-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Power & Uptime</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              {latestMetrics?.battery.isCharging ? (
                <BatteryCharging className="w-4 h-4 text-emerald-400" />
              ) : (
                <Battery className="w-4 h-4" />
              )}
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              {latestMetrics?.battery.hasBattery ? (
                <>
                  <span>{latestMetrics.battery.percent}%</span>
                  {latestMetrics.battery.isCharging && (
                    <span className="text-xs text-emerald-400 font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10">
                      Charging
                    </span>
                  )}
                </>
              ) : (
                <span>AC Powered</span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Uptime: {uptimeHours} hours</span>
            </p>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${
                (latestMetrics?.battery.percent || 100) < 20 ? 'bg-rose-500' : 'bg-amber-400'
              }`}
              style={{ width: `${Math.min(latestMetrics?.battery.percent || 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Live Charts */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-surface-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <h3 className="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span>CPU Load History (%)</span>
            </h3>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" hide />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                  />
                  <Area type="monotone" dataKey="cpu" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#cpuGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-surface-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <h3 className="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-400" />
              <span>Memory Load History (%)</span>
            </h3>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="memGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" hide />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                  />
                  <Area type="monotone" dataKey="memory" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#memGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 4. Quick Actions & Power Management */}
      <div className="bg-surface-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <h2 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand-400" />
          <span>Quick Actions & Power Controls</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => navigate('/files')}
            className="p-3.5 rounded-xl bg-surface-850 hover:bg-surface-800 border border-slate-700/80 text-left transition flex flex-col justify-between group cursor-pointer"
          >
            <FolderTree className="w-5 h-5 text-brand-400 group-hover:scale-110 transition-transform mb-3" />
            <div>
              <p className="text-xs font-semibold text-slate-200">Browse Files</p>
              <p className="text-[10px] text-slate-400">Upload & download</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/apps')}
            className="p-3.5 rounded-xl bg-surface-850 hover:bg-surface-800 border border-slate-700/80 text-left transition flex flex-col justify-between group cursor-pointer"
          >
            <Laptop className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform mb-3" />
            <div>
              <p className="text-xs font-semibold text-slate-200">Launch Apps</p>
              <p className="text-[10px] text-slate-400">Approved programs</p>
            </div>
          </button>

          <button
            onClick={() => setConfirmAction('LOCK')}
            disabled={!isOnline}
            className="p-3.5 rounded-xl bg-surface-850 hover:bg-surface-800 disabled:opacity-50 border border-slate-700/80 text-left transition flex flex-col justify-between group cursor-pointer"
          >
            <Lock className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform mb-3" />
            <div>
              <p className="text-xs font-semibold text-slate-200">Lock Laptop</p>
              <p className="text-[10px] text-slate-400">Secure session</p>
            </div>
          </button>

          <button
            onClick={() => setConfirmAction('SLEEP')}
            disabled={!isOnline}
            className="p-3.5 rounded-xl bg-surface-850 hover:bg-surface-800 disabled:opacity-50 border border-slate-700/80 text-left transition flex flex-col justify-between group cursor-pointer"
          >
            <Moon className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform mb-3" />
            <div>
              <p className="text-xs font-semibold text-slate-200">Sleep</p>
              <p className="text-[10px] text-slate-400">Low-power mode</p>
            </div>
          </button>

          <button
            onClick={() => setConfirmAction('RESTART')}
            disabled={!isOnline}
            className="p-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-50 border border-rose-500/30 text-left transition flex flex-col justify-between group cursor-pointer"
          >
            <RotateCcw className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform mb-3" />
            <div>
              <p className="text-xs font-semibold text-rose-300">Restart Laptop</p>
              <p className="text-[10px] text-rose-400/80">Reboot Windows</p>
            </div>
          </button>

          <button
            onClick={() => setConfirmAction('SHUTDOWN')}
            disabled={!isOnline}
            className="p-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-50 border border-rose-500/30 text-left transition flex flex-col justify-between group cursor-pointer"
          >
            <Power className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform mb-3" />
            <div>
              <p className="text-xs font-semibold text-rose-300">Shut Down</p>
              <p className="text-[10px] text-rose-400/80">Power off laptop</p>
            </div>
          </button>
        </div>
      </div>

      {/* Confirmation Modals for Destructive Actions */}
      <ConfirmModal
        isOpen={confirmAction === 'LOCK'}
        title="Lock Workstation?"
        message="This will immediately lock the Windows workstation session on your laptop. You will need your Windows password or PIN to unlock it physically."
        confirmLabel="Lock Workstation"
        isDestructive={false}
        onConfirm={handlePowerAction}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmModal
        isOpen={confirmAction === 'SLEEP'}
        title="Put Laptop to Sleep?"
        message="Putting the laptop to sleep will disconnect the RemoteDesk agent. You will not be able to connect until the laptop is physically awakened or powered on."
        confirmLabel="Put to Sleep"
        isDestructive={true}
        onConfirm={handlePowerAction}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmModal
        isOpen={confirmAction === 'RESTART'}
        title="Restart Windows Laptop?"
        message="Restarting will close all open applications and temporarily disconnect the RemoteDesk agent. The laptop will reconnect once Windows boots back up and the agent starts."
        confirmLabel="Restart Laptop"
        isDestructive={true}
        onConfirm={handlePowerAction}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmModal
        isOpen={confirmAction === 'SHUTDOWN'}
        title="Shut Down Laptop?"
        message="Shutting down will power off the laptop. The dashboard will permanently disconnect until you physically turn the laptop back on. Remote wake from full shutdown requires Wake-on-LAN hardware setup."
        confirmLabel="Shut Down Laptop"
        isDestructive={true}
        onConfirm={handlePowerAction}
        onCancel={() => setConfirmAction(null)}
      />

      {/* Screenshot Modal */}
      {screenshotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-4xl bg-surface-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-brand-400" />
                <h3 className="font-semibold text-sm text-slate-100">Live Desktop Screenshot</h3>
                <span className="text-xs text-slate-500">
                  {new Date(screenshotModal.capturedAt).toLocaleTimeString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={screenshotModal.url}
                  download="remotedesk_screenshot.jpg"
                  className="px-3 py-1.5 rounded-lg bg-surface-850 hover:bg-surface-800 border border-slate-700 text-xs text-slate-200 flex items-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  onClick={() => setScreenshotModal(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/40">
              <img
                src={screenshotModal.url}
                alt="Laptop Desktop Screenshot"
                className="max-w-full max-h-[70vh] rounded-lg shadow-lg object-contain border border-slate-800"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
