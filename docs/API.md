# RemoteDesk REST API & WebSocket Specification

Base URL: `/api/v1`

All responses follow a consistent contract:

### Success Response
```json
{
  "success": true,
  "data": {},
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "DEVICE_OFFLINE",
    "message": "The device is currently offline."
  },
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## 1. Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/login` | Login with email & password, sets session cookie |
| `POST` | `/api/v1/auth/logout` | Revokes current session and clears cookie |
| `GET` | `/api/v1/auth/session` | Get currently authenticated user profile |

---

## 2. Devices

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/devices` | List all enrolled laptops and live statuses |
| `POST` | `/api/v1/devices/enroll` | Enroll new laptop, generates device ID and secret key |
| `GET` | `/api/v1/devices/:deviceId` | Get device details and latest telemetry |
| `POST` | `/api/v1/devices/:deviceId/revoke` | Revoke device credentials permanently |
| `GET` | `/api/v1/devices/:deviceId/status` | Get quick online/offline status |

---

## 3. Telemetry & Monitoring

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/devices/:deviceId/metrics` | Get latest CPU, RAM, disk, and battery metrics |
| `GET` | `/api/v1/devices/:deviceId/metrics/history` | Historical metrics for charts (query: `limit`) |

---

## 4. File Management

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/devices/:deviceId/files` | Browse directory in permitted roots (query: `path`) |
| `POST` | `/api/v1/devices/:deviceId/files/upload` | Multipart file upload to authorized folder |
| `GET` | `/api/v1/devices/:deviceId/files/download` | Stream download of permitted file |
| `POST` | `/api/v1/devices/:deviceId/files/folder` | Create new folder (`parentPath`, `name`) |
| `PATCH` | `/api/v1/devices/:deviceId/files/rename` | Rename file/folder (`currentPath`, `newName`) |
| `DELETE` | `/api/v1/devices/:deviceId/files` | Delete file/folder (`path`) |

---

## 5. Applications & Operations

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/devices/:deviceId/applications` | List approved applications |
| `POST` | `/api/v1/devices/:deviceId/applications/:id/launch` | Launch approved application |
| `POST` | `/api/v1/devices/:deviceId/tasks` | Submit approved operation task |
| `GET` | `/api/v1/tasks` | List recent background tasks |
| `GET` | `/api/v1/tasks/:taskId` | Inspect task execution status and results |
| `POST` | `/api/v1/tasks/:taskId/cancel` | Cancel running task |

---

## 6. Screenshots & Power Controls

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/devices/:deviceId/screenshots` | Trigger on-demand desktop screenshot |
| `GET` | `/api/v1/screenshots/:screenshotId` | Serve captured screenshot image |
| `POST` | `/api/v1/devices/:deviceId/power/lock` | Lock Windows workstation (`confirm: true`) |
| `POST` | `/api/v1/devices/:deviceId/power/sleep` | Put laptop to sleep (`confirm: true`) |
| `POST` | `/api/v1/devices/:deviceId/power/restart` | Reboot laptop (`confirm: true`) |
| `POST` | `/api/v1/devices/:deviceId/power/shutdown` | Shut down laptop (`confirm: true`) |

---

## 7. WebSocket Events

| Event | Direction | Payload | Description |
|---|---|---|---|
| `agent:auth` | Agent ➔ Server | `{ deviceId, secretKey, agentVersion }` | Agent authentication handshake |
| `agent:heartbeat` | Agent ➔ Server | `{ deviceId, timestamp, uptimeSeconds }` | Keep-alive heartbeat ping |
| `agent:metrics` | Agent ➔ Server | `SystemMetrics` | Real-time hardware telemetry |
| `task:execute` | Server ➔ Agent | `Task` | Dispatched operation to agent |
| `agent:task:update`| Agent ➔ Server | `{ taskId, status, result, error }` | Task execution progress/completion |
| `device:status:changed`| Server ➔ Client | `{ deviceId, status, lastSeenAt }` | Live status broadcast to dashboard |
| `metrics:updated` | Server ➔ Client | `SystemMetrics` | Live metrics stream to subscribers |
