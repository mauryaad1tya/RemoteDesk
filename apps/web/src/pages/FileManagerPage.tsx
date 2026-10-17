import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FolderTree,
  Folder,
  FileText,
  FileCode,
  FileArchive,
  Image,
  Upload,
  FolderPlus,
  Download,
  Trash2,
  Edit2,
  ChevronRight,
  RefreshCw,
  ArrowUp,
  HardDrive,
  AlertCircle,
  File,
} from 'lucide-react';
import { useActiveDevice } from '../hooks/useActiveDevice.js';
import { api } from '../services/api.js';
import { ConfirmModal } from '../components/ConfirmModal.js';
import { FileItem } from '@remotedesk/shared';

export function FileManagerPage() {
  const queryClient = useQueryClient();
  const { activeDeviceId, isOnline, refetchDevices } = useActiveDevice();

  const [currentPath, setCurrentPath] = useState('');
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [itemToRename, setItemToRename] = useState<FileItem | null>(null);
  const [newName, setNewName] = useState('');
  const [itemToDelete, setItemToDelete] = useState<FileItem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch directory listing
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['files', activeDeviceId, currentPath],
    queryFn: () => (activeDeviceId ? api.browseFiles(activeDeviceId, currentPath) : null),
    enabled: !!activeDeviceId && isOnline,
    retry: 1,
  });

  const createFolderMutation = useMutation({
    mutationFn: () => api.createFolder(activeDeviceId!, currentPath, newFolderName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', activeDeviceId, currentPath] });
      setCreateFolderOpen(false);
      setNewFolderName('');
    },
    onError: (err: any) => setErrorMessage(err.message || 'Failed to create folder'),
  });

  const renameMutation = useMutation({
    mutationFn: () => api.renameFile(activeDeviceId!, itemToRename!.path, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', activeDeviceId, currentPath] });
      setItemToRename(null);
      setNewName('');
    },
    onError: (err: any) => setErrorMessage(err.message || 'Failed to rename item'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteFile(activeDeviceId!, itemToDelete!.path),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', activeDeviceId, currentPath] });
      setItemToDelete(null);
    },
    onError: (err: any) => setErrorMessage(err.message || 'Failed to delete item'),
  });

  const uploadMutation = useMutation({
    mutationFn: () => api.uploadFile(activeDeviceId!, currentPath, selectedFile!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', activeDeviceId, currentPath] });
      setUploadModalOpen(false);
      setSelectedFile(null);
    },
    onError: (err: any) => setErrorMessage(err.message || 'Upload failed'),
  });

  const handleDownload = (item: FileItem) => {
    if (!activeDeviceId) return;
    const url = api.getDownloadUrl(activeDeviceId, item.path);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.name;
    a.click();
  };

  const getFileIcon = (item: FileItem) => {
    if (item.isDirectory) {
      return <Folder className="w-5 h-5 text-amber-400 shrink-0" />;
    }
    const ext = item.extension?.toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext || '')) {
      return <Image className="w-5 h-5 text-purple-400 shrink-0" />;
    }
    if (['.js', '.ts', '.tsx', '.py', '.json', '.html', '.css', '.ps1'].includes(ext || '')) {
      return <FileCode className="w-5 h-5 text-blue-400 shrink-0" />;
    }
    if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(ext || '')) {
      return <FileArchive className="w-5 h-5 text-amber-500 shrink-0" />;
    }
    if (['.txt', '.md', '.log', '.doc', '.pdf'].includes(ext || '')) {
      return <FileText className="w-5 h-5 text-slate-300 shrink-0" />;
    }
    return <File className="w-5 h-5 text-slate-400 shrink-0" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  if (!isOnline) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 bg-surface-900 border border-slate-800 rounded-2xl">
        <FolderTree className="w-12 h-12 text-slate-600 mb-3" />
        <h2 className="text-base font-bold text-slate-200">Device is Offline</h2>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mb-4">
          The remote file manager connects directly to your laptop agent. Please ensure the laptop is running and connected.
        </p>
        <button
          onClick={() => refetchDevices()}
          className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-brand-900/30 transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Check Status Again</span>
        </button>
      </div>
    );
  }

  const items = data?.items || [];
  const parentPath = data?.parentPath;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Error alert */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-slate-400 hover:text-slate-200">
            ✕
          </button>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
        {/* Breadcrumb Path */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs text-slate-300 scrollbar-none">
          <button
            onClick={() => setCurrentPath('')}
            className="p-1 rounded-md hover:bg-surface-800 text-brand-400 font-semibold flex items-center gap-1 shrink-0"
          >
            <HardDrive className="w-4 h-4" />
            <span>Permitted Roots</span>
          </button>

          {currentPath && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span className="font-mono text-slate-200 shrink-0 px-1 py-0.5 rounded bg-surface-850">
                {currentPath}
              </span>
            </>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {parentPath !== undefined && parentPath !== null && (
            <button
              onClick={() => setCurrentPath(parentPath)}
              className="p-2 rounded-xl bg-surface-850 hover:bg-surface-800 border border-slate-700/80 text-slate-300 hover:text-white transition cursor-pointer text-xs flex items-center gap-1.5"
              title="Go to parent directory"
            >
              <ArrowUp className="w-4 h-4" />
              <span className="hidden sm:inline">Up</span>
            </button>
          )}

          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl bg-surface-850 hover:bg-surface-800 border border-slate-700/80 text-slate-300 hover:text-white transition cursor-pointer text-xs"
            title="Refresh directory"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {currentPath && (
            <>
              <button
                onClick={() => setCreateFolderOpen(true)}
                className="px-3 py-2 rounded-xl bg-surface-850 hover:bg-surface-800 border border-slate-700/80 text-slate-200 hover:text-white transition cursor-pointer text-xs flex items-center gap-1.5"
              >
                <FolderPlus className="w-4 h-4 text-amber-400" />
                <span>New Folder</span>
              </button>

              <button
                onClick={() => setUploadModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-lg shadow-brand-900/30 transition cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Files Table / List */}
      <div className="bg-surface-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading directory contents from laptop...</div>
        ) : error ? (
          <div className="p-12 text-center text-rose-400 text-xs">{(error as any).message || 'Failed to load directory'}</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">This directory is empty</div>
        ) : (
          <div className="divide-y divide-slate-800/80 overflow-x-auto">
            <div className="grid grid-cols-12 px-4 py-2.5 bg-surface-950/60 text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
              <span className="col-span-6 sm:col-span-5">Name</span>
              <span className="col-span-3 sm:col-span-3">Modified</span>
              <span className="col-span-3 sm:col-span-2 text-right">Size</span>
              <span className="hidden sm:block sm:col-span-2 text-right">Actions</span>
            </div>

            {items.map(item => (
              <div
                key={item.path}
                className="grid grid-cols-12 items-center px-4 py-3 text-xs hover:bg-surface-850/60 transition group"
              >
                {/* Name */}
                <div
                  onClick={() => item.isDirectory && setCurrentPath(item.path)}
                  className={`col-span-6 sm:col-span-5 flex items-center gap-2.5 truncate pr-2 ${
                    item.isDirectory ? 'cursor-pointer hover:text-brand-300 font-medium' : 'text-slate-300'
                  }`}
                >
                  {getFileIcon(item)}
                  <span className="truncate">{item.name}</span>
                </div>

                {/* Modified */}
                <div className="col-span-3 sm:col-span-3 text-slate-400 text-[11px] truncate">
                  {new Date(item.modifiedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </div>

                {/* Size */}
                <div className="col-span-3 sm:col-span-2 text-right font-mono text-[11px] text-slate-400">
                  {formatSize(item.sizeBytes)}
                </div>

                {/* Actions */}
                <div className="hidden sm:flex col-span-2 items-center justify-end gap-1">
                  {!item.isDirectory && (
                    <button
                      onClick={() => handleDownload(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-brand-300 hover:bg-surface-800 transition"
                      title="Download file"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setItemToRename(item);
                      setNewName(item.name);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-800 transition"
                    title="Rename"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setItemToDelete(item)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Folder Modal */}
      {createFolderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-surface-850 border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-100">
            <h3 className="font-semibold text-sm mb-3">Create New Folder</h3>
            <input
              type="text"
              autoFocus
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full p-2.5 bg-surface-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 outline-hidden focus:border-brand-500"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setCreateFolderOpen(false)}
                className="px-3.5 py-1.5 text-xs rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => createFolderMutation.mutate()}
                disabled={!newFolderName.trim() || createFolderMutation.isPending}
                className="px-4 py-1.5 text-xs font-medium rounded-xl bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-50"
              >
                {createFolderMutation.isPending ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {itemToRename && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-surface-850 border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-100">
            <h3 className="font-semibold text-sm mb-3">Rename {itemToRename.isDirectory ? 'Folder' : 'File'}</h3>
            <input
              type="text"
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-full p-2.5 bg-surface-900 border border-slate-700 rounded-xl text-xs text-slate-100 outline-hidden focus:border-brand-500"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setItemToRename(null)}
                className="px-3.5 py-1.5 text-xs rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => renameMutation.mutate()}
                disabled={!newName.trim() || renameMutation.isPending}
                className="px-4 py-1.5 text-xs font-medium rounded-xl bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-50"
              >
                {renameMutation.isPending ? 'Renaming...' : 'Rename'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-surface-850 border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-100">
            <h3 className="font-semibold text-sm mb-2">Upload File to Laptop</h3>
            <p className="text-[11px] text-slate-400 mb-4 truncate font-mono">Destination: {currentPath}</p>

            <div className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center hover:border-brand-500 transition">
              <input
                type="file"
                id="filePicker"
                onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <label htmlFor="filePicker" className="cursor-pointer flex flex-col items-center">
                <Upload className="w-8 h-8 text-brand-400 mb-2" />
                <span className="text-xs font-medium text-slate-200">
                  {selectedFile ? selectedFile.name : 'Click to select file from your device'}
                </span>
                {selectedFile && (
                  <span className="text-[10px] text-slate-400 mt-1 font-mono">
                    {formatSize(selectedFile.size)}
                  </span>
                )}
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setUploadModalOpen(false)}
                className="px-3.5 py-1.5 text-xs rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => uploadMutation.mutate()}
                disabled={!selectedFile || uploadMutation.isPending}
                className="px-4 py-1.5 text-xs font-medium rounded-xl bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-50"
              >
                {uploadMutation.isPending ? 'Uploading...' : 'Start Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!itemToDelete}
        title={`Delete ${itemToDelete?.isDirectory ? 'Folder' : 'File'}?`}
        message={`Are you sure you want to permanently delete '${itemToDelete?.name}' from your laptop? This cannot be undone.`}
        confirmLabel="Delete"
        isDestructive={true}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
}
