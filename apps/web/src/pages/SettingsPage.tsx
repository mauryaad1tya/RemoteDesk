import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  Save,
  FolderTree,
  Activity,
  Check,
  AlertCircle,
  Plus,
  Trash2,
  Monitor,
} from 'lucide-react';
import { api } from '../services/api.js';

export function SettingsPage() {
  const queryClient = useQueryClient();

  const [heartbeatInterval, setHeartbeatInterval] = useState(10);
  const [metricsInterval, setMetricsInterval] = useState(5);
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [remoteDesktopUrl, setRemoteDesktopUrl] = useState('');
  const [permittedRoots, setPermittedRoots] = useState<string[]>([]);
  const [newRootInput, setNewRootInput] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.getSettings(),
  });

  useEffect(() => {
    if (data?.settings) {
      setHeartbeatInterval(data.settings.heartbeatIntervalSec || 10);
      setMetricsInterval(data.settings.metricsIntervalSec || 5);
      setTheme(data.settings.theme || 'dark');
      setRemoteDesktopUrl(data.settings.remoteDesktopUrl || '');
      setPermittedRoots(data.settings.permittedRoots || ['C:\\Users', 'D:\\']);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (settings: any) => api.updateSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSaveSuccess(true);
      setErrorMessage(null);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to update settings');
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      heartbeatIntervalSec: heartbeatInterval,
      metricsIntervalSec: metricsInterval,
      theme,
      remoteDesktopUrl,
      permittedRoots,
    });
  };

  const handleAddRoot = () => {
    if (newRootInput.trim() && !permittedRoots.includes(newRootInput.trim())) {
      setPermittedRoots([...permittedRoots, newRootInput.trim()]);
      setNewRootInput('');
    }
  };

  const handleRemoveRoot = (rootToRemove: string) => {
    setPermittedRoots(permittedRoots.filter(r => r !== rootToRemove));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">System & Security Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure telemetry intervals, remote file access boundaries, and connection preferences.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Settings successfully saved and synchronized with agent.</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Telemetry & Heartbeat Intervals */}
        <div className="bg-surface-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Activity className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-semibold text-white">Telemetry & Collection Intervals</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <label className="font-medium text-slate-300">Metrics Interval</label>
                <span className="font-mono text-brand-400">{metricsInterval} seconds</span>
              </div>
              <input
                type="range"
                min={3}
                max={60}
                step={1}
                value={metricsInterval}
                onChange={e => setMetricsInterval(Number(e.target.value))}
                className="w-full accent-brand-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Frequency at which the Windows agent samples CPU, RAM, and storage utilization.
              </p>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <label className="font-medium text-slate-300">Heartbeat Interval</label>
                <span className="font-mono text-brand-400">{heartbeatInterval} seconds</span>
              </div>
              <input
                type="range"
                min={5}
                max={120}
                step={5}
                value={heartbeatInterval}
                onChange={e => setHeartbeatInterval(Number(e.target.value))}
                className="w-full accent-brand-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Frequency at which the agent pings the server to verify presence and detect offline state.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Permitted File Roots */}
        <div className="bg-surface-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <FolderTree className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-semibold text-white">Authorized File Roots</h2>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            The remote file manager is restricted strictly to paths inside these folders. Traversal or navigation outside these roots is automatically blocked by the agent security module.
          </p>

          <div className="space-y-2">
            {permittedRoots.map(root => (
              <div
                key={root}
                className="flex items-center justify-between p-2.5 rounded-xl bg-surface-850 border border-slate-800 text-xs"
              >
                <span className="font-mono text-slate-200">{root}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveRoot(root)}
                  className="p-1 text-slate-400 hover:text-rose-400 transition"
                  title="Remove root"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              value={newRootInput}
              onChange={e => setNewRootInput(e.target.value)}
              placeholder="e.g. C:\Users or D:\Projects"
              className="flex-1 p-2 bg-surface-850 border border-slate-700 rounded-xl text-xs text-slate-200 outline-hidden focus:border-brand-500"
            />
            <button
              type="button"
              onClick={handleAddRoot}
              className="px-3 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Root</span>
            </button>
          </div>
        </div>

        {/* 3. Theme & Preferences */}
        <div className="bg-surface-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Monitor className="w-5 h-5 text-brand-400" />
            <h2 className="text-sm font-semibold text-white">Application Theme</h2>
          </div>

          <div className="flex items-center gap-4">
            {(['dark', 'light', 'system'] as const).map(t => (
              <label
                key={t}
                className={`flex-1 p-3.5 rounded-xl border text-xs font-medium capitalize text-center cursor-pointer transition ${
                  theme === t
                    ? 'bg-brand-600/15 border-brand-500 text-brand-300'
                    : 'bg-surface-850 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="theme"
                  value={t}
                  checked={theme === t}
                  onChange={() => setTheme(t)}
                  className="hidden"
                />
                <span>{t} Theme</span>
              </label>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-brand-900/30 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{updateMutation.isPending ? 'Saving Settings...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
