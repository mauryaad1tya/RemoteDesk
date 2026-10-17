# RemoteDesk Windows Agent Guide

The RemoteDesk Windows Agent runs on the target laptop and performs authorized management operations.

---

## 1. Responsibilities

- **Authentication**: Establishes outbound connection to RemoteDesk server and authenticates with device secret.
- **Heartbeat Loop**: Periodically sends keep-alive pings to maintain ONLINE status.
- **Hardware Telemetry**: Collects real Windows CPU load, RAM usage, storage volumes, battery level, charging status, and network counters without pegging CPU.
- **Path-Validated File Operations**: Performs directory listings, uploads, downloads, and deletions strictly inside permitted roots.
- **Process & Application Manager**: Launches allowlisted applications and samples active processes.
- **Power Operations**: Locks workstation, triggers sleep, initiates restart or shutdown.
- **Desktop Screenshots**: Captures primary display image using native Windows GDI+ APIs.

---

## 2. Configuration (`.env`)

```ini
# RemoteDesk Agent Settings
AGENT_API_URL=http://localhost:4000
AGENT_DEVICE_ID=your-device-uuid-here
AGENT_SECRET_KEY=your-generated-secret-key-here
AGENT_METRIC_INTERVAL_MS=5000
AGENT_HEARTBEAT_INTERVAL_MS=10000
AGENT_PERMITTED_ROOTS=C:\Users,D:\
```

---

## 3. Running the Agent

### During Development:
```bash
npm run dev:agent
```

### In Production / On Startup:
You can configure Windows Task Scheduler or Windows Startup folder to run the agent when you log in:

1. Create a batch script `run-agent.bat`:
   ```bat
   @echo off
   cd /d "D:\All\Projects\RemoteDesk"
   npm run start -w agent
   ```
2. Press `Win + R`, type `shell:startup`, and place a shortcut to `run-agent.bat` in that folder.
3. The agent will automatically start upon login and maintain its connection!

---

## 4. Uninstallation & Removal

To completely remove the agent:
1. Stop the agent process (close terminal or kill `node.exe`).
2. Remove any shortcut in `shell:startup` or Task Scheduler task.
3. In the RemoteDesk dashboard, navigate to **Devices** and click **Revoke** on that laptop to permanently invalidate its secret key in the database.
