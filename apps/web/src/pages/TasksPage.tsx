import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ListTodo,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  StopCircle,
  Eye,
  Copy,
  Check,
} from 'lucide-react';
import { useActiveDevice } from '../hooks/useActiveDevice.js';
import { api } from '../services/api.js';
import { Task, TaskStatus } from '@remotedesk/shared';

export function TasksPage() {
  const queryClient = useQueryClient();
  const { activeDeviceId } = useActiveDevice();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: tasks = [], isLoading, refetch } = useQuery({
    queryKey: ['tasks', activeDeviceId],
    queryFn: () => api.getTasks(activeDeviceId || undefined),
    refetchInterval: 5000,
  });

  const cancelMutation = useMutation({
    mutationFn: (taskId: string) => api.cancelTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            <span>Completed</span>
          </span>
        );
      case 'RUNNING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 animate-pulse">
            <Clock className="w-3 h-3" />
            <span>Running</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3 h-3" />
            <span>Failed</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <XCircle className="w-3 h-3" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            <span>{status}</span>
          </span>
        );
    }
  };

  const copyTaskId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Background Task Manager</h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitor real-time execution status, background operations, and task results.
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

      {/* Task List Table */}
      <div className="bg-surface-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">No tasks recorded yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Task ID</th>
                  <th className="px-4 py-3">Operation</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Progress</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {tasks.map(task => (
                  <tr key={task.id} className="hover:bg-surface-850/50 transition">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                      {task.id.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">
                      {task.operationType}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(task.status)}</td>
                    <td className="px-4 py-3">
                      <div className="w-24 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-brand-500 h-1.5 rounded-full"
                          style={{
                            width: `${
                              task.status === 'COMPLETED'
                                ? 100
                                : task.progressPercent || (task.status === 'RUNNING' ? 50 : 10)
                            }%`,
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button
                        onClick={() => setSelectedTask(task)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-300 hover:bg-surface-800 transition"
                        title="View details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {(task.status === 'PENDING' || task.status === 'RUNNING') && (
                        <button
                          onClick={() => cancelMutation.mutate(task.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="Cancel task"
                        >
                          <StopCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-surface-850 border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">Task Details</h3>
                <span className="text-xs text-slate-400 font-mono">({selectedTask.id})</span>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-3 bg-surface-900 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500">Operation:</span>
                  <p className="font-semibold text-slate-200 mt-0.5">{selectedTask.operationType}</p>
                </div>
                <div>
                  <span className="text-slate-500">Status:</span>
                  <div className="mt-0.5">{getStatusBadge(selectedTask.status)}</div>
                </div>
                <div>
                  <span className="text-slate-500">Created At:</span>
                  <p className="text-slate-300 mt-0.5">{new Date(selectedTask.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-slate-500">Completed At:</span>
                  <p className="text-slate-300 mt-0.5">
                    {selectedTask.completedAt ? new Date(selectedTask.completedAt).toLocaleString() : 'In Progress'}
                  </p>
                </div>
              </div>

              {selectedTask.errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
                  <span className="font-semibold block mb-1">Error Information:</span>
                  <p className="font-mono text-[11px]">{selectedTask.errorMessage}</p>
                </div>
              )}

              <div>
                <span className="text-slate-400 font-medium block mb-1.5">Parameters:</span>
                <pre className="p-3 rounded-xl bg-surface-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
                  {JSON.stringify(selectedTask.parameters, null, 2)}
                </pre>
              </div>

              {selectedTask.result && (
                <div>
                  <span className="text-slate-400 font-medium block mb-1.5">Execution Result:</span>
                  <pre className="p-3 rounded-xl bg-surface-950 border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-56">
                    {JSON.stringify(selectedTask.result, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-700/60 flex justify-end">
              <button
                onClick={() => setSelectedTask(null)}
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
