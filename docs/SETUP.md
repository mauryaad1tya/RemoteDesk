# RemoteDesk Setup Guide

This guide walks you through setting up RemoteDesk locally and connecting your smartphone to your Windows laptop across different networks.

---

## 1. Prerequisites

- **Windows 10 or 11 (64-bit)**
- **Node.js LTS (v22+ or v24+)**
- **npm (v10+ or v11+)**
- **Tailscale** (free account on [tailscale.com](https://tailscale.com) for secure cross-network access)

---

## 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/mauryaad1tya/RemoteDesk.git
cd RemoteDesk
npm install
```

Copy the environment template:

```bash
copy .env.example .env
```

---

## 3. Database Initialization & Seeding

Run the SQLite migrations and seed initial default settings:

```bash
npm run db:seed
```

This creates `remotedesk.db` in `services/api/data/` with:
- Default Admin User: `admin@remotedesk.local`
- Default Password: `RemoteDesk@Admin2025!`
- Default permitted file roots: `C:\Users`, `D:\`
- Default application allowlist (Notepad, Calculator, Explorer, Task Manager)
- Default operation allowlist

---

## 4. Starting the Application

You can start all services concurrently or independently.

### Option A: Start API and Frontend together
```bash
# Terminal 1: Start API Service
npm run dev:api

# Terminal 2: Start Web Frontend
npm run dev:web
```

The Web Dashboard will be available at:
`http://localhost:5173` (or `http://<your-tailscale-ip>:5173`)

---

## 5. Enrolling Your Windows Laptop

1. Open `http://localhost:5173` on your browser and sign in.
2. Navigate to **Devices** in the sidebar.
3. Click **Enroll New Laptop**.
4. Enter your laptop's display name and click **Generate Enrollment Keys**.
5. Copy the generated `AGENT_DEVICE_ID` and `AGENT_SECRET_KEY` into your `.env` file or pass them as environment variables.
6. Start the Windows agent:

```bash
npm run dev:agent
```

7. Observe that your laptop immediately turns **ONLINE** (green indicator) on the dashboard!

---

## 6. Accessing from your Smartphone over Mobile Data / Away from Home

1. Install **Tailscale** on your Windows laptop and on your iPhone or Android phone.
2. Sign in with the same Tailscale account on both devices.
3. Find your laptop's Tailscale IP address (e.g. `100.x.y.z`).
4. On your smartphone's browser, open:
   `http://100.x.y.z:5173`
5. You can now monitor hardware, manage files, capture screenshots, and trigger actions from anywhere in the world!
