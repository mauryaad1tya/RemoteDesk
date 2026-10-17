import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './hooks/useAuth.js';
import { DeviceProvider } from './hooks/useActiveDevice.js';
import { DashboardLayout } from './layouts/DashboardLayout.js';

import { LoginPage } from './pages/LoginPage.js';
import { OverviewPage } from './pages/OverviewPage.js';
import { DevicesPage } from './pages/DevicesPage.js';
import { RemoteDesktopPage } from './pages/RemoteDesktopPage.js';
import { FileManagerPage } from './pages/FileManagerPage.js';
import { ApplicationsPage } from './pages/ApplicationsPage.js';
import { OperationsPage } from './pages/OperationsPage.js';
import { SystemMonitorPage } from './pages/SystemMonitorPage.js';
import { TasksPage } from './pages/TasksPage.js';
import { ActivityPage } from './pages/ActivityPage.js';
import { SettingsPage } from './pages/SettingsPage.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5000,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-surface-950 text-slate-400 text-xs font-mono">
        Authenticating RemoteDesk session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DeviceProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<OverviewPage />} />
                <Route path="devices" element={<DevicesPage />} />
                <Route path="remote-desktop" element={<RemoteDesktopPage />} />
                <Route path="files" element={<FileManagerPage />} />
                <Route path="apps" element={<ApplicationsPage />} />
                <Route path="operations" element={<OperationsPage />} />
                <Route path="monitor" element={<SystemMonitorPage />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="activity" element={<ActivityPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </DeviceProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
export default App;
