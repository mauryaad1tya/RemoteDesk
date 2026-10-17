import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Laptop,
  Plus,
  Trash2,
  Copy,
  Check,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Key,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useActiveDevice } from '../hooks/useActiveDevice.js';
import { api } from '../services/api.js';
import { ConfirmModal } from '../components/ConfirmModal.js';
import { Device } from '@remotedesk/shared';

export function DevicesPage() {
  const queryClient = useQueryClient();
  const { devices, activeDeviceId, setActiveDeviceId, refetchDevices } = useActiveDevice();

  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [deviceToRevoke, setDeviceToRevoke] = useState<Device | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [hostname, setHostname] = useState('');
  const [osName, setOsName] = useState('Windows 11 Pro');
  const [osVersion, setOsVersion] = useState('10.0.26100');
  const [arch, setArch] = useState('x64');

  // Enrolled credentials display modal
  const [enrollmentResult, setEnrollmentResult] = useState<{
    deviceId: string;
    secretKey: string;
    displayName: string;
  } | null>(null);

  const enrollMutation = useMutation({
    mutationFn: (data: any) => api.enrollDevice(data),
    onSuccess: res => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      setEnrollModalOpen(false);
      setEnrollmentResult({
        deviceId: res.credentials.deviceId,
        secretKey: res.credentials.secretKey,
        displayName: res.device.displayName,
      });
      // Reset form
      setDisplayName('');
      setHostname('');
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => api.revokeDevice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      setDeviceToRevoke(null);
    },
  });

  const handleEnrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    enrollMutation.mutate({
      displayName,
      hostname: hostname || 'MY-LAPTOP',
      osName,
      osVersion,
      arch,
      agentVersion: '1.0.0',
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Managed Laptops & Devices</h1>
          <p className="text-xs text-slate-400 mt-1">
            Enroll your Windows computers, manage authorization keys, and monitor connection status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetchDevices()}
            className="p-2.5 rounded-xl bg-surface-850 hover:bg-surface-800 border border-slate-700/80 text-slate-300 hover:text-white transition cursor-pointer text-xs flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => setEnrollModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-brand-900/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Enroll New Laptop</span>
          </button>
        </div>
      </div>

      {/* Device List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map(device => {
          const isOnline = (device as any).isOnline || device.status === 'ONLINE';
          const isCurrentActive = device.id === activeDeviceId;

          return (
            <div
              key={device.id}
              className={`bg-surface-900 border rounded-2xl p-5 shadow-lg flex flex-col justify-between transition ${
                isCurrentActive ? 'border-brand-500/60 shadow-brand-500/5' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Laptop className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-white">{device.displayName}</h3>
                      <p className="text-[11px] text-slate-400 font-mono">{device.hostname}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1 ${
                      isOnline
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : device.status === 'UNAUTHORIZED'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                    {device.status}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>OS Platform:</span>
                    <span className="text-slate-200">{device.osName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Architecture:</span>
                    <span className="text-slate-200">{device.arch}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Agent Version:</span>
                    <span className="text-slate-200">v{device.agentVersion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Seen:</span>
                    <span className="text-slate-200">
                      {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Never'}
                    </span>
                  </div>
                  {device.ipAddress && (
                    <div className="flex justify-between">
                      <span>IP Address:</span>
                      <span className="text-slate-200 font-mono">{device.ipAddress}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => setActiveDeviceId(device.id)}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition cursor-pointer ${
                    isCurrentActive
                      ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
                      : 'bg-surface-850 hover:bg-surface-800 text-slate-300 border border-slate-700/80'
                  }`}
                >
                  {isCurrentActive ? 'Active in Dashboard' : 'Select Device'}
                </button>

                <button
                  onClick={() => setDeviceToRevoke(device)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                  title="Revoke device access"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enroll Modal */}
      {enrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-surface-850 border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-700/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400">
                  <Key className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-base">Enroll New Windows Laptop</h3>
              </div>
              <button
                onClick={() => setEnrollModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEnrollSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="e.g. Aditya's Work Laptop"
                  className="w-full p-2.5 bg-surface-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 outline-hidden focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Hostname (Computer Name)</label>
                  <input
                    type="text"
                    required
                    value={hostname}
                    onChange={e => setHostname(e.target.value)}
                    placeholder="WIN-LAPTOP1"
                    className="w-full p-2.5 bg-surface-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 outline-hidden focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Operating System</label>
                  <input
                    type="text"
                    required
                    value={osName}
                    onChange={e => setOsName(e.target.value)}
                    placeholder="Windows 11 Pro"
                    className="w-full p-2.5 bg-surface-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 outline-hidden focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-900 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Enrolling generates a unique cryptographic secret key for this computer. The agent will authenticate securely and will never expose open management ports to the internet.
                </span>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setEnrollModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enrollMutation.isPending}
                  className="px-5 py-2 text-xs font-medium rounded-xl bg-brand-600 hover:bg-brand-500 text-white transition shadow-lg shadow-brand-900/30 cursor-pointer"
                >
                  {enrollMutation.isPending ? 'Generating Credentials...' : 'Generate Enrollment Keys'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generated Credentials Result Modal */}
      {enrollmentResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-surface-850 border border-emerald-500/40 rounded-2xl p-6 shadow-2xl text-slate-100">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-700/60">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Laptop Successfully Enrolled</h3>
                <p className="text-xs text-slate-400">{enrollmentResult.displayName}</p>
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-300">
              Copy these credentials into your Windows agent environment or configuration file. For security, the secret key is only shown once.
            </p>

            <div className="mt-4 p-4 rounded-xl bg-surface-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-2 select-all">
              <div>
                <span className="text-slate-500">AGENT_DEVICE_ID=</span>
                <span className="text-emerald-400">{enrollmentResult.deviceId}</span>
              </div>
              <div>
                <span className="text-slate-500">AGENT_SECRET_KEY=</span>
                <span className="text-amber-400">{enrollmentResult.secretKey}</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-700/60">
              <button
                onClick={() =>
                  copyToClipboard(
                    `AGENT_DEVICE_ID=${enrollmentResult.deviceId}\nAGENT_SECRET_KEY=${enrollmentResult.secretKey}\n`
                  )
                }
                className="px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-2 transition cursor-pointer"
              >
                {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedKey ? 'Copied to Clipboard!' : 'Copy Config'}</span>
              </button>

              <button
                onClick={() => setEnrollmentResult(null)}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Confirmation */}
      <ConfirmModal
        isOpen={!!deviceToRevoke}
        title="Revoke Device Credentials?"
        message={`Are you sure you want to revoke '${deviceToRevoke?.displayName}'? Its connection will be terminated immediately and it will be permanently blocked from reconnecting until re-enrolled.`}
        confirmLabel="Revoke Device"
        isDestructive={true}
        onConfirm={() => deviceToRevoke && revokeMutation.mutate(deviceToRevoke.id)}
        onCancel={() => setDeviceToRevoke(null)}
      />
    </div>
  );
}
