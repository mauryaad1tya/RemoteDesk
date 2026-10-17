import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Laptop,
  MonitorPlay,
  FolderTree,
  PlaySquare,
  Terminal,
  Activity,
  ListTodo,
  ShieldAlert,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronDown,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { useActiveDevice } from '../hooks/useActiveDevice.js';
import { NotificationCenter } from '../components/NotificationCenter.js';

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const { devices, activeDevice, activeDeviceId, setActiveDeviceId, isOnline } = useActiveDevice();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [deviceDropdownOpen, setDeviceDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Overview', to: '/', icon: LayoutDashboard },
    { label: 'Devices', to: '/devices', icon: Laptop },
    { label: 'Remote Desktop', to: '/remote-desktop', icon: MonitorPlay },
    { label: 'File Manager', to: '/files', icon: FolderTree },
    { label: 'Applications', to: '/apps', icon: PlaySquare },
    { label: 'Command Console', to: '/operations', icon: Terminal },
    { label: 'System Monitor', to: '/monitor', icon: Activity },
    { label: 'Tasks', to: '/tasks', icon: ListTodo },
    { label: 'Activity Log', to: '/activity', icon: ShieldAlert },
    { label: 'Settings', to: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-surface-950 text-slate-100 font-sans overflow-hidden">
      {/* 1. Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-surface-900 border-r border-slate-800/80 z-20">
        {/* Brand */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Laptop className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-white">RemoteDesk</span>
            <span className="block text-[10px] text-slate-400 font-medium">Windows Management</span>
          </div>
        </div>

        {/* Device Switcher */}
        <div className="p-3 border-b border-slate-800/60">
          <div className="relative">
            <button
              onClick={() => setDeviceDropdownOpen(!deviceDropdownOpen)}
              className="w-full flex items-center justify-between p-2 rounded-lg bg-surface-850 hover:bg-surface-800 border border-slate-800 text-left transition"
            >
              <div className="flex items-center gap-2.5 truncate">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isOnline ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-slate-500'}`} />
                <span className="text-xs font-semibold text-slate-200 truncate">
                  {activeDevice ? activeDevice.displayName : 'No Device Selected'}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {deviceDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface-850 border border-slate-700/80 rounded-lg shadow-xl z-30 py-1 max-h-48 overflow-y-auto">
                {devices.map(d => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setActiveDeviceId(d.id);
                      setDeviceDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-slate-800 transition ${
                      d.id === activeDeviceId ? 'text-brand-400 font-semibold bg-brand-500/10' : 'text-slate-300'
                    }`}
                  >
                    <span className="truncate">{d.displayName}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${d.status === 'ONLINE' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 bg-slate-800'}`}>
                      {d.status}
                    </span>
                  </button>
                ))}
                {devices.length === 0 && (
                  <div className="p-3 text-[11px] text-slate-400 text-center">No enrolled devices</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-900/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-surface-850'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Profile */}
        <div className="p-3 border-t border-slate-800/80 bg-surface-900/60">
          <div className="flex items-center justify-between">
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'Owner'}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-surface-800 transition"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-surface-900 border-b border-slate-800/80 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-800 transition"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Brand */}
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
                <Laptop className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm tracking-tight text-white">RemoteDesk</span>
            </div>

            {/* Laptop Status Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-850 border border-slate-800 text-xs">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span className="text-slate-300 font-medium">
                {activeDevice ? activeDevice.displayName : 'Select a device'}
              </span>
              <span className="text-slate-500">•</span>
              <span className={`text-[11px] font-semibold ${isOnline ? 'text-emerald-400' : 'text-slate-500'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-850 transition relative"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
            </button>

            {/* Mobile Logout */}
            <button
              onClick={handleLogout}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-surface-850 transition"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
          <Outlet />
        </main>

        {/* 3. Mobile Bottom Navigation Bar */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface-900 border-t border-slate-800/90 flex items-center justify-around px-2 z-30">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-14 h-full text-[10px] font-medium transition ${
                isActive ? 'text-brand-400' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span>Overview</span>
          </NavLink>
          <NavLink
            to="/files"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-14 h-full text-[10px] font-medium transition ${
                isActive ? 'text-brand-400' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <FolderTree className="w-5 h-5 mb-0.5" />
            <span>Files</span>
          </NavLink>
          <NavLink
            to="/remote-desktop"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-14 h-full text-[10px] font-medium transition ${
                isActive ? 'text-brand-400' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <MonitorPlay className="w-5 h-5 mb-0.5" />
            <span>Remote</span>
          </NavLink>
          <NavLink
            to="/monitor"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-14 h-full text-[10px] font-medium transition ${
                isActive ? 'text-brand-400' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <Activity className="w-5 h-5 mb-0.5" />
            <span>Monitor</span>
          </NavLink>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center w-14 h-full text-[10px] font-medium text-slate-400 hover:text-slate-200 transition"
          >
            <Menu className="w-5 h-5 mb-0.5" />
            <span>More</span>
          </button>
        </nav>
      </div>

      {/* 4. Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-surface-900 h-full border-r border-slate-800 flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                  <Laptop className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-base text-white">RemoteDesk</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 border-b border-slate-800/80">
              <p className="text-[11px] font-medium text-slate-400 mb-1.5 px-1">Active Laptop</p>
              <select
                value={activeDeviceId || ''}
                onChange={e => {
                  setActiveDeviceId(e.target.value);
                  setMobileMenuOpen(false);
                }}
                className="w-full text-xs bg-surface-850 border border-slate-700/80 rounded-lg p-2 text-slate-200 outline-hidden"
              >
                {devices.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.displayName} ({d.status})
                  </option>
                ))}
              </select>
            </div>

            <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                      isActive
                        ? 'bg-brand-600 text-white'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-surface-850'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-800 bg-surface-950/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-200">{user?.name}</p>
                  <p className="text-[10px] text-slate-500">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Popover */}
      <NotificationCenter isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  );
}
