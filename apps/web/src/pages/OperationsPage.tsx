import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Terminal,
  Play,
  Copy,
  Check,
  ShieldCheck,
  AlertCircle,
  Clock,
  RotateCcw,
  Activity,
  HardDrive,
  Globe,
  Server,
} from 'lucide-react';
import { useActiveDevice } from '../hooks/useActiveDevice.js';
import { api } from '../services/api.js';
import { AllowedOperation } from '@remotedesk/shared';

export function OperationsPage() {
  const { activeDeviceId, isOnline } = useActiveDevice();
  const [selectedOp, setSelectedOp] = useState<string>('SYSTEM_INFO');
  const [consoleOutput, setConsoleOutput] = useState<string>('RemoteDesk Restricted Command Console v1.0.0\nReady. Select an authorized operation and press "Run Operation".\n');
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [copied, setCopied] = useState(false);

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.getSettings(),
  });

  const operations = settingsData?.operations || [
    {
      id: 'SYSTEM_INFO',
      name: 'Query System Info',
      description: 'Collect hardware, OS version, and uptime information',
      timeoutSeconds: 15,
      requiresConfirmation: false,
      category: 'SYSTEM',
    },
    {
      id: 'LIST_PROCESSES',
      name: 'List Active Processes',
      description: 'List top running processes and resource consumption',
      timeoutSeconds: 20,
      requiresConfirmation: false,
      category: 'DIAGNOSTIC',
    },
    {
      id: 'DISK_USAGE',
      name: 'Analyze Disk Usage',
      description: 'Check free and used storage across all mounted partitions',
      timeoutSeconds: 15,
      requiresConfirmation: false,
      category: 'SYSTEM',
    },
    {
      id: 'NETWORK_CONNECTIVITY',
      name: 'Test Network Connectivity',
      description: 'Ping standard gateway and public DNS to verify internet reachability',
      timeoutSeconds: 25,
      requiresConfirmation: false,
      category: 'NETWORK',
    },
  ];

  const runMutation = useMutation({
    mutationFn: (opId: string) => api.createTask(activeDeviceId!, opId, {}),
    onMutate: opId => {
      setStatus('running');
      setConsoleOutput(prev => prev + `\n$ remotedesk exec --operation ${opId}\n[info] Task dispatched to agent. Awaiting execution result...\n`);
    },
    onSuccess: async task => {
      // Poll or fetch task result
      try {
        let currentTask = task;
        let attempts = 0;
        while (
          (currentTask.status === 'PENDING' || currentTask.status === 'QUEUED' || currentTask.status === 'RUNNING') &&
          attempts < 15
        ) {
          await new Promise(r => setTimeout(r, 1000));
          currentTask = await api.getTask(task.id);
          attempts++;
        }

        if (currentTask.status === 'COMPLETED') {
          setStatus('success');
          setConsoleOutput(
            prev => prev + `[success] Operation completed successfully:\n` + JSON.stringify(currentTask.result, null, 2) + '\n'
          );
        } else {
          setStatus('error');
          setConsoleOutput(
            prev => prev + `[error] Task ended with status: ${currentTask.status}. ${currentTask.errorMessage || ''}\n`
          );
        }
      } catch (err: any) {
        setStatus('error');
        setConsoleOutput(prev => prev + `[error] Failed to fetch task result: ${err.message}\n`);
      }
    },
    onError: (err: any) => {
      setStatus('error');
      setConsoleOutput(prev => prev + `[error] Execution failed: ${err.message}\n`);
    },
  });

  const copyConsole = () => {
    navigator.clipboard.writeText(consoleOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'NETWORK':
        return <Globe className="w-4 h-4 text-emerald-400" />;
      case 'DIAGNOSTIC':
        return <Activity className="w-4 h-4 text-rose-400" />;
      default:
        return <Server className="w-4 h-4 text-brand-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Restricted Command Console</h1>
        <p className="text-xs text-slate-400 mt-1">
          Execute safe, pre-authorized system operations on your Windows laptop.
        </p>
      </div>

      {/* Security Banner */}
      <div className="p-4 rounded-xl bg-surface-900 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-200">Strict Command Policy:</strong> To protect your laptop from injection vulnerabilities, arbitrary shell strings are disabled. All console actions execute via fixed, parameter-validated native operations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Operation Selector */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Authorized Operations</h2>
          <div className="space-y-2">
            {operations.map(op => (
              <button
                key={op.id}
                onClick={() => setSelectedOp(op.id)}
                className={`w-full p-3.5 rounded-xl text-left border transition flex items-start gap-3 cursor-pointer ${
                  selectedOp === op.id
                    ? 'bg-brand-600/10 border-brand-500/50 text-white shadow-md'
                    : 'bg-surface-900 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="p-2 rounded-lg bg-surface-850 shrink-0 mt-0.5">
                  {getCategoryIcon(op.category)}
                </div>
                <div>
                  <h3 className="font-semibold text-xs text-white">{op.name}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{op.description}</p>
                  <span className="inline-block mt-2 font-mono text-[10px] text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded">
                    Timeout: {op.timeoutSeconds}s
                  </span>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => runMutation.mutate(selectedOp)}
            disabled={!isOnline || runMutation.isPending}
            className="w-full mt-4 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand-900/30 transition cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{runMutation.isPending ? 'Executing Operation...' : 'Run Operation'}</span>
          </button>
        </div>

        {/* Right: Terminal Console Output */}
        <div className="lg:col-span-2 bg-surface-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[520px]">
          {/* Terminal Window Header */}
          <div className="h-10 px-4 bg-surface-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-mono text-xs text-slate-400">cmd-console://{activeDeviceId || 'local'}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyConsole}
                className="p-1 rounded text-slate-400 hover:text-slate-200 transition"
                title="Copy output"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setConsoleOutput('$ remotedesk console cleared\n')}
                className="p-1 rounded text-slate-400 hover:text-slate-200 transition"
                title="Clear console"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Console Text Area */}
          <div className="flex-1 p-4 font-mono text-xs text-emerald-400 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text">
            {consoleOutput}
            {status === 'running' && (
              <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse align-middle ml-1" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
