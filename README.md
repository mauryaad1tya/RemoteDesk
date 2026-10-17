# RemoteDesk

A self-hosted web dashboard and background agent for managing and monitoring a Windows laptop remotely from a phone or secondary device.

It is designed to run over private networks (like Tailscale or LAN), allowing you to check system stats, transfer files, launch apps, take screenshots, or restart the machine without port-forwarding or exposing Windows RDP to the open internet.

---

## Why this exists

Most remote access tools either require opening ports to the public internet (which is dangerous for RDP), or rely on third-party cloud brokers where you don't control the server or data.

RemoteDesk uses a simple client-server architecture:
1. An **Express API + WebSocket server** with SQLite for local state, sessions, and audit logs.
2. A lightweight **Windows Agent** running locally that makes an outbound connection to the server, so your laptop never needs an open incoming port.
3. A mobile-friendly **React dashboard** for checking hardware stats and triggering tasks from your phone browser.

When paired with a private mesh VPN like Tailscale, you get access over mobile data or foreign Wi-Fi with end-to-end WireGuard encryption.

---

## Features

- **System Telemetry**: Real-time CPU, RAM, disk usage, battery status, and uptime streamed over WebSockets.
- **Remote File Manager**: Browse permitted directories, download files, upload documents, and manage folders. Path traversal attacks outside configured roots are blocked.
- **Application Launcher**: Start pre-approved programs (Notepad, Calculator, Explorer, etc.) with PID tracking. Arbitrary command injection is disallowed.
- **Restricted Command Console**: Run fixed diagnostic operations (system info, running processes, disk usage, network ping) with live terminal output.
- **On-Demand Screenshots**: Capture display snapshots directly from the web interface.
- **Power Management**: Workstation lock, sleep, restart, and shutdown with explicit confirmation prompts.
- **Audit Logging**: Keeps an immutable log of login attempts, file operations, app launches, and power commands.

---

## Project Structure

```
remotedesk/
├── apps/
│   └── web/            # React 18, Vite, Tailwind CSS dashboard
├── services/
│   └── api/            # Express, native node:sqlite, Socket.IO, JWT auth
├── agent/              # Windows agent process (system metrics, files, power)
├── packages/
│   └── shared/         # Shared schemas (Zod), types, and socket event constants
├── docs/               # Detailed documentation
│   ├── ARCHITECTURE.md
│   ├── SETUP.md
│   ├── SECURITY.md
│   ├── API.md
│   ├── WINDOWS_AGENT.md
│   ├── REMOTE_ACCESS.md
│   └── TROUBLESHOOTING.md
├── start-remotedesk.bat # One-click Windows launcher
└── package.json
```

---

## Getting Started

### Prerequisites

- Windows 10 or 11 (64-bit)
- Node.js LTS (v22 or v24 recommended)
- npm v10+

### 1. Installation

```bash
git clone https://github.com/mauryaad1tya/RemoteDesk.git
cd RemoteDesk

# Install dependencies across all monorepo packages
npm install

# Create local environment config
copy .env.example .env

# Initialize database schema and default admin account
npm run db:seed
```

Default credentials created by `npm run db:seed`:
- **Email**: `admin@remotedesk.local`
- **Password**: `RemoteDesk@Admin2025!`

### 2. Running the Application

You can start everything in a single step using the provided launcher:

**Option A — Windows Batch File (Recommended):**
Double-click `start-remotedesk.bat`, or run from PowerShell:
```cmd
.\start-remotedesk.bat
```
This boots the API (port 4000), Vite frontend (port 5173), and the background agent concurrently in one terminal, and opens your browser automatically.

**Option B — npm:**
```bash
npm run dev
```

---

## Remote Access (Phone / Outside Home)

To access your laptop from your phone over mobile data or another Wi-Fi network:

1. Install [Tailscale](https://tailscale.com) on both your laptop and phone, and sign in with the same account.
2. Get your laptop's Tailscale IP (e.g. `100.x.y.z`).
3. Open your mobile browser and navigate to:
   ```
   http://100.x.y.z:5173
   ```
4. Log in and manage your machine securely.

See [docs/REMOTE_ACCESS.md](docs/REMOTE_ACCESS.md) for detailed configuration, including setting up Microsoft Remote Desktop (RD Client) over Tailscale.

---

## Development & Testing

```bash
# Run unit and integration tests across all packages
npm run test

# Typecheck and build production bundles
npm run build
```

---

## Documentation

- [Architecture & Data Flow](docs/ARCHITECTURE.md)
- [Step-by-Step Setup Guide](docs/SETUP.md)
- [Security Model & Path Sandboxing](docs/SECURITY.md)
- [REST API & WebSocket Contract](docs/API.md)
- [Windows Agent Internals](docs/WINDOWS_AGENT.md)
- [Remote Access & Tailscale Setup](docs/REMOTE_ACCESS.md)
- [Troubleshooting Common Issues](docs/TROUBLESHOOTING.md)

---

## License

MIT
