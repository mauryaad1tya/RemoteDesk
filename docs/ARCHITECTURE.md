# RemoteDesk System Architecture

RemoteDesk is an end-to-end, zero-trust remote management system designed to monitor and manage a Windows laptop from a smartphone or browser over the internet without exposing management ports directly to the public internet.

```
┌────────────────────────────────────────────────────────┐
│             Controller Device (Phone / Web)            │
│  React 18 + Vite + Tailwind CSS + Lucide Icons         │
│  - Real-time WebSockets (Socket.IO)                    │
│  - TanStack Query v5                                   │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / WSS
                            ▼
┌────────────────────────────────────────────────────────┐
│               RemoteDesk API Server (Express)          │
│  - SQLite with WAL Mode & Migrations                   │
│  - JWT & HttpOnly Session Cookies                      │
│  - Rate Limiting, Audit Logging & Input Validation     │
│  - WebSocket Hub & Task Dispatcher                     │
└───────────────────────────▲────────────────────────────┘
                            │ Outbound Socket.IO
                            │ (Zero Inbound Ports Required)
┌───────────────────────────┴────────────────────────────┐
│              RemoteDesk Windows Agent                  │
│  - System Monitoring (CPU, RAM, Disks, Battery)        │
│  - Permitted File Operations (Anti-Traversal Sandbox)  │
│  - Approved Application Launcher                       │
│  - Controlled Power Manager (Lock, Sleep, Reboot)      │
│  - Screenshot Engine (Windows GDI+ / Session Detection)│
└────────────────────────────────────────────────────────┘
```

## Core Architectural Principles

1. **Outbound-Only Connection Model**:
   The Windows laptop connects outbound to the management server or private WireGuard mesh. It does not listen on an unauthenticated public IP or require router port forwarding.

2. **Defense in Depth**:
   - Authentication required on every endpoint.
   - Server-side session validation in SQLite allows instant revocation.
   - Command allowlist prevents arbitrary shell injection.
   - Strict path normalization sandboxes file operations inside owner-configured permitted roots.

3. **Real-Time Bidirectional Event Streaming**:
   Live CPU, memory, and task execution progress stream over Socket.IO to the mobile dashboard with automatic reconnection, jitter, and exponential backoff.

4. **Honest Platform Capability Detection**:
   Platform limits (such as non-interactive sessions, Windows Home RDP limitations, or locked desktops) are detected and surfaced clearly rather than simulated with fake data.
