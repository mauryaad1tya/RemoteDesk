# RemoteDesk 🖥️📱

> **Private Remote Windows Laptop Management & Remote Access System**
> Securely monitor, manage, and access your personal Windows laptop from your smartphone or browser over the internet across any network.

---

## 🌟 Key Features

- **📱 Mobile-First Responsive Dashboard**: Clean dark-mode interface built with React, Vite, Tailwind CSS, and Lucide icons.
- **⚡ Real-Time Hardware Telemetry**: Live CPU load, RAM usage, storage volumes, battery level, charging status, and network counters via WebSockets.
- **📁 Secure Remote File Manager**: Browse permitted directories, upload, download, create folders, rename, and delete with anti-traversal sandboxing.
- **🚀 Approved Application Launcher**: Launch approved Windows programs (Notepad, Calculator, Explorer, etc.) with PID tracking and zero arbitrary command injection.
- **🛡️ Restricted Command Console**: Execute pre-authorized system operations (Query System Info, Process Manager, Disk Check, Network Connectivity) with terminal output.
- **📸 On-Demand Desktop Screenshots**: Capture high-resolution display snapshots with instant preview and download.
- **⚡ Controlled Power Operations**: Safely lock workstation, transition to sleep, restart, or power off with explicit safety confirmations.
- **🌐 Private Mesh Networking**: Tailscale WireGuard integration allows seamless connection over cellular data with **zero router port forwarding** and **zero open public ports**.
- **📋 Immutable Audit Trail**: Comprehensive audit logging for all authentication attempts, file transfers, app launches, and power commands.

---

## 🏗️ Architecture & Monorepo Structure

```
remotedesk/
├── apps/
│   └── web/            # React 18 + Vite + Tailwind CSS dashboard
├── services/
│   └── api/            # Express + TypeScript + SQLite + Socket.IO server
├── agent/              # Windows Agent service for system control
├── packages/
│   └── shared/         # Zod schemas, constants, and TypeScript types
├── docs/               # System architecture and setup guides
│   ├── ARCHITECTURE.md
│   ├── SETUP.md
│   ├── SECURITY.md
│   ├── API.md
│   ├── WINDOWS_AGENT.md
│   ├── REMOTE_ACCESS.md
│   └── TROUBLESHOOTING.md
├── .env.example
├── package.json
└── README.md
```

---

## 🚀 Quick Start

### 1. Prerequisites
- Windows 10/11 (64-bit)
- Node.js LTS (v22+ or v24+)
- npm (v10+ or v11+)

### 2. Installation & Database Setup
```bash
# Clone the repository
git clone https://github.com/mauryaad1tya/RemoteDesk.git
cd RemoteDesk

# Install dependencies across all packages
npm install

# Setup environment variables
copy .env.example .env

# Run SQLite migrations and seed initial admin user & allowlists
npm run db:seed
```

### 3. Launch Services
```bash
# Terminal 1: Start API Backend (Port 4000)
npm run dev:api

# Terminal 2: Start Web Frontend (Port 5173)
npm run dev:web

# Terminal 3: Start Windows Agent
npm run dev:agent
```

Open `http://localhost:5173` on your browser and sign in with default credentials:
- **Email**: `admin@remotedesk.local`
- **Password**: `RemoteDesk@Admin2025!`

---

## 🧪 Testing

All test suites can be executed across the monorepo with:

```bash
# Run all unit, integration, and E2E tests
npm run test

# Run build verification for all packages
npm run build
```

---

## 📖 Documentation Links

- [Architecture Guide](docs/ARCHITECTURE.md)
- [Setup & Getting Started](docs/SETUP.md)
- [Security Model & Policies](docs/SECURITY.md)
- [REST API & WebSocket Contract](docs/API.md)
- [Windows Agent Guide](docs/WINDOWS_AGENT.md)
- [Remote Access via Tailscale](docs/REMOTE_ACCESS.md)
- [Troubleshooting Common Issues](docs/TROUBLESHOOTING.md)

---

## 📜 License
MIT License. Built for secure personal laptop management.
