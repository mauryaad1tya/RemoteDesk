import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldAlert,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  Lock,
} from 'lucide-react';
import { api } from '../services/api.js';
import { AuditLog } from '@remotedesk/shared';

export function ActivityPage() {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['activity'],
    queryFn: () => api.getActivity(100),
    refetchInterval: 10000,
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Security & Activity Audit Log</h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable audit trail of authentication events, remote commands, file transfers, and device access.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="p-2.5 rounded-xl bg-surface-850 hover:bg-surface-800 border border-slate-700/80 text-slate-300 hover:text-white transition cursor-pointer text-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Audit Log Table */}
      <div className="bg-surface-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading audit trail...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">No activity logged yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Target Device</th>
                  <th className="px-4 py-3">IP Address</th>
                  <th className="px-4 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-surface-850/50 transition">
                    <td className="px-4 py-3 text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">
                      {log.action}
                    </td>
                    <td className="px-4 py-3">
                      {log.status === 'SUCCESS' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>SUCCESS</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                          <AlertCircle className="w-3 h-3" />
                          <span>FAILURE</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                      {log.deviceId ? `${log.deviceId.slice(0, 8)}...` : 'System'}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                      {log.ipAddress || 'Internal'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {log.details ? (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-300 hover:bg-surface-800 transition"
                          title="View audit context"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-surface-850 border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-100 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
              <h3 className="font-bold text-sm text-white">Audit Record Context</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between p-2 rounded-lg bg-surface-900 border border-slate-800">
                <span className="text-slate-400">Action:</span>
                <span className="font-semibold text-white">{selectedLog.action}</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-surface-900 border border-slate-800">
                <span className="text-slate-400">Timestamp:</span>
                <span className="text-slate-200">{new Date(selectedLog.createdAt).toLocaleString()}</span>
              </div>

              <div>
                <span className="text-slate-400 font-medium block mb-1">Details:</span>
                <pre className="p-3 rounded-xl bg-surface-950 border border-slate-800 font-mono text-[11px] text-brand-300 overflow-x-auto max-h-56">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-700/60 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-xs font-medium rounded-xl bg-brand-600 hover:bg-brand-500 text-white transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
