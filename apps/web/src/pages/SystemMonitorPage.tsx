import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Cpu,
  Layers,
  HardDrive,
  Battery,
  BatteryCharging,
  Clock,
  Network,
  RefreshCw,
  Server,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useActiveDevice } from '../hooks/useActiveDevice.js';
import { api } from '../services/api.js';

export function SystemMonitorPage() {
  const { activeDeviceId, isOnline, latestMetrics } = useActiveDevice();
  const [historyLimit, setHistoryLimit] = useState(60);

  const { data: history = [], refetch } = useQuery({
    queryKey: ['monitor-history', activeDeviceId, historyLimit],
    queryFn: () => (activeDeviceId ? api.getMetricsHistory(activeDeviceId, historyLimit) : []),
    enabled: !!activeDeviceId,
    refetchInterval: 5000,
  });

  const chartData = history.map(m => ({
    time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    cpu: m.cpu.currentLoad,
    memory: m.memory.usedPercent,
  }));

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(1)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)} MB`;
  };

  const memUsed = latestMetrics ? formatBytes(latestMetrics.memory.usedBytes) : '—';
  const memTotal = latestMetrics ? formatBytes(latestMetrics.memory.totalBytes) : '—';
  const memFree = latestMetrics ? formatBytes(latestMetrics.memory.freeBytes) : '—';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">System Monitor & Hardware Telemetry</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time performance metrics, storage utilization, and historical load trends.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={historyLimit}
            onChange={e => setHistoryLimit(Number(e.target.value))}
            className="p-2 rounded-xl bg-surface-850 border border-slate-700 text-xs text-slate-200 outline-hidden"
          >
            <option value={30}>Last 30 datapoints</option>
            <option value={60}>Last 60 datapoints</option>
            <option value={120}>Last 120 datapoints</option>
          </select>

          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-xl bg-surface-850 hover:bg-surface-800 border border-slate-700/80 text-slate-300 hover:text-white transition cursor-pointer text-xs"
            title="Refresh metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Historical CPU & Memory Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU Chart */}
        <div className="bg-surface-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="font-semibold text-sm text-white">CPU Utilization Trend (%)</h3>
                <p className="text-[11px] text-slate-400">
                  {latestMetrics ? `${latestMetrics.cpu.cores} Cores • ${latestMetrics.cpu.model}` : 'Processor'}
                </p>
              </div>
            </div>
            <span className="text-xl font-bold text-indigo-400">
              {latestMetrics ? `${latestMetrics.cpu.currentLoad}%` : '—'}
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="monCpuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={10} tickLine={false} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="cpu" stroke="#6366f1" strokeWidth={2} fill="url(#monCpuGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Memory Chart */}
        <div className="bg-surface-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand-400" />
              <div>
                <h3 className="font-semibold text-sm text-white">Memory Utilization Trend (%)</h3>
                <p className="text-[11px] text-slate-400">
                  {memUsed} Used / {memTotal} Total ({memFree} Available)
                </p>
              </div>
            </div>
            <span className="text-xl font-bold text-brand-400">
              {latestMetrics ? `${latestMetrics.memory.usedPercent}%` : '—'}
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="monMemGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={10} tickLine={false} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="memory" stroke="#818cf8" strokeWidth={2} fill="url(#monMemGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Storage Volumes Breakdown */}
      <div className="bg-surface-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-emerald-400" />
          <span>Storage Volumes & Partitions</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(latestMetrics?.disks || []).map(disk => (
            <div key={disk.mount} className="p-4 rounded-xl bg-surface-850 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-white font-mono">{disk.mount}</span>
                <span className="text-xs text-slate-400">{disk.type}</span>
              </div>
              <div className="flex items-baseline justify-between text-xs mb-1.5">
                <span className="text-slate-300">
                  {formatBytes(disk.usedBytes)} of {formatBytes(disk.sizeBytes)} used
                </span>
                <span className="font-semibold text-slate-100">{disk.usedPercent}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full ${disk.usedPercent > 85 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(disk.usedPercent, 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-2 text-right">
                {formatBytes(disk.availableBytes)} free space
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
