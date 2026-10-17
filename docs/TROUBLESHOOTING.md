# RemoteDesk Troubleshooting Guide

Common issues and resolution steps for RemoteDesk.

---

## 1. Laptop Shows "Offline" on Dashboard

### Symptoms
- Dashboard status badge says "Offline" (gray/red indicator).
- Metrics and file manager operations fail with "Agent is offline".

### Solutions
1. **Verify Agent Process**: Ensure the agent is running:
   ```bash
   npm run dev:agent
   ```
2. **Check Agent Logs**: Look for authentication errors:
   - `Agent authentication rejected by server`: Your `AGENT_DEVICE_ID` or `AGENT_SECRET_KEY` in `.env` is incorrect or the device was revoked. Re-enroll the laptop in the dashboard and update `.env`.
   - `Connection error, backing off`: The agent cannot reach `AGENT_API_URL`. Ensure the backend API server is running (`npm run dev:api`).
3. **Verify Stale Threshold**: If the laptop went to sleep or the network disconnected for > 35 seconds, the server marks the device offline until the next heartbeat arrives upon reconnecting.

---

## 2. File Manager Says "Access Denied: Path is outside permitted roots"

### Cause
RemoteDesk enforces strict directory sandboxing to prevent traversal attacks.

### Solution
- Check authorized roots in the **Settings** page or your agent's `AGENT_PERMITTED_ROOTS` variable.
- By default, `C:\Users` and `D:\` are permitted. If you want to access another drive (e.g. `E:\`), add it to the **Authorized File Roots** in Settings or update `AGENT_PERMITTED_ROOTS=C:\Users,D:\,E:\` in `.env`.

---

## 3. Desktop Screenshot Shows "Unavailable in Non-Interactive Session"

### Cause
Windows GDI+ screen capture requires access to an active interactive desktop session (Session 1+). If the laptop screen is locked, disconnected, or running as a headless Windows background service (Session 0), Windows blocks desktop display reading for security reasons.

### Solution
- Ensure a user is logged into Windows with an active display session.
- If locked, unlock the laptop with your PIN or password.

---

## 4. Cannot Connect from Phone over Mobile Network

### Solutions
1. Verify Tailscale is active and connected on both the laptop and phone.
2. Ping the laptop's Tailscale IP (`100.x.y.z`) from the Tailscale app on your phone.
3. Check Windows Firewall: ensure port `5173` (Vite) and port `4000` (API) allow incoming connections on private network interfaces:
   ```powershell
   New-NetFirewallRule -DisplayName "RemoteDesk Web" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
   New-NetFirewallRule -DisplayName "RemoteDesk API" -Direction Inbound -LocalPort 4000 -Protocol TCP -Action Allow
   ```

---

## 5. Native Remote Desktop Fails to Connect

### Solutions
1. Verify Windows edition: Windows Home does not support being an RDP host (upgrade to Windows Pro or use RustDesk as detailed in `docs/REMOTE_ACCESS.md`).
2. Verify Remote Desktop is enabled: `Settings > System > Remote Desktop`.
3. Verify user account has a password set (Windows blocks blank password RDP connections by default).
