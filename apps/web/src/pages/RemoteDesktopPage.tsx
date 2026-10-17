import React, { useState } from 'react';
import {
  MonitorPlay,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  Smartphone,
  Laptop,
  Network,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { useActiveDevice } from '../hooks/useActiveDevice.js';

export function RemoteDesktopPage() {
  const { activeDevice, isOnline } = useActiveDevice();
  const [copied, setCopied] = useState(false);

  const ip = activeDevice?.ipAddress || '100.x.y.z';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadRdp = () => {
    const rdpContent = `full address:s:${ip}\nprompt for credentials:i:1\nadministrative session:i:1\n`;
    const blob = new Blob([rdpContent], { type: 'application/x-rdp' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeDevice?.displayName || 'RemoteLaptop'}.rdp`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Remote Desktop Access</h1>
        <p className="text-xs text-slate-400 mt-1">
          Access your interactive Windows desktop securely across different Wi-Fi and mobile networks.
        </p>
      </div>

      {/* Connection Status Card */}
      <div className="bg-surface-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <MonitorPlay className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  {activeDevice ? activeDevice.displayName : 'No Device Selected'}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    isOnline
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {isOnline ? 'Online & Reachable' : 'Device Offline'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Host: <span className="font-mono text-slate-300">{activeDevice?.hostname || 'Unknown'}</span> •
                Target IP: <span className="font-mono text-slate-300">{ip}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(ip)}
              className="px-3.5 py-2 rounded-xl bg-surface-850 hover:bg-surface-800 border border-slate-700 text-xs text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'IP Copied' : 'Copy IP'}</span>
            </button>

            <button
              onClick={handleDownloadRdp}
              disabled={!isOnline}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-brand-900/30 transition cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Download .RDP Profile</span>
            </button>
          </div>
        </div>

        {/* Security Alert */}
        <div className="mt-5 p-4 rounded-xl bg-brand-500/5 border border-brand-500/20 text-xs text-slate-300 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-100">Zero-Trust Private Mesh Networking (Tailscale)</p>
            <p className="text-slate-400 leading-relaxed">
              RemoteDesk does NOT require or recommend opening RDP port 3389 to the public internet. Connect using Tailscale on your phone and laptop so your desktop stream remains encrypted end-to-end inside your private WireGuard mesh.
            </p>
          </div>
        </div>
      </div>

      {/* Connect from Mobile & Laptop Guides */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* From Smartphone (iOS & Android) */}
        <div className="bg-surface-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Connecting from iPhone or Android</h3>
              <p className="text-[11px] text-slate-400">Touch-friendly remote desktop</p>
            </div>
          </div>

          <ol className="space-y-3 text-xs text-slate-300 list-decimal list-inside leading-relaxed">
            <li>
              Install <strong className="text-white">Tailscale</strong> from App Store / Google Play and sign in to connect to your mesh.
            </li>
            <li>
              Install <strong className="text-white">RD Client (Microsoft Remote Desktop)</strong> on your phone.
            </li>
            <li>
              Tap <strong className="text-brand-300">+ Add PC</strong> and enter your laptop's IP address:
              <span className="block mt-1 font-mono text-[11px] bg-surface-950 p-2 rounded-lg border border-slate-800 text-brand-300">
                {ip}
              </span>
            </li>
            <li>
              Enter your Windows username and password when prompted. Enable touch pointer mode in settings for easy mobile navigation.
            </li>
          </ol>
        </div>

        {/* Platform Editions & Prerequisites */}
        <div className="bg-surface-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Windows Editions & Compatibility</h3>
              <p className="text-[11px] text-slate-400">Native RDP host requirements</p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-100">Windows 10 / 11 Pro, Enterprise, Education:</strong>
                <p className="text-slate-400 mt-0.5">
                  Native RDP Host is fully supported. Go to <code className="bg-surface-850 px-1 py-0.5 rounded text-slate-300">Settings &gt; System &gt; Remote Desktop</code> and toggle "Enable Remote Desktop".
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 pt-2 border-t border-slate-800">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-100">Windows Home Edition Limitation:</strong>
                <p className="text-slate-400 mt-0.5">
                  Microsoft disables incoming RDP on Windows Home. For Windows Home laptops, use RustDesk, MeshCentral, or Apache Guacamole as documented in <code className="text-brand-300">docs/REMOTE_ACCESS.md</code>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
