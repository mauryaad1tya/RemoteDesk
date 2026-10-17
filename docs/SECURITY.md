# RemoteDesk Security Architecture & Policy

RemoteDesk is designed from the ground up with a defense-in-depth security model to ensure your laptop is never exposed to unauthorized control.

---

## 1. Authentication & Session Management

- **Strong Password Hashing**: Passwords are saved as one-way salted hashes using `bcryptjs` with 12 salt rounds. Plaintext passwords are never logged or stored.
- **Server-Side Session Revocation**: Every session token is recorded in the `sessions` table in SQLite. When an owner logs out or revokes access, the session is invalidated server-side immediately.
- **HttpOnly Cookies & Bearer Tokens**: Web session cookies are configured with `HttpOnly`, `SameSite=Lax`, and `Secure` in production to mitigate XSS exfiltration.
- **Brute-Force Rate Limiting**: Authentication endpoints and sensitive commands are protected by a sliding-window rate limiter per client IP address.

---

## 2. Windows Agent Security Sandbox

- **No Arbitrary Shell Execution**: The agent rejects raw shell command strings. All operations execute via strict, named operation IDs with Zod schema validation.
- **Path Traversal Protection**: File manager operations are strictly bounded to owner-configured permitted roots (e.g. `C:\Users`, `D:\`). The path validator resolves canonical symlinks and realpaths (`fs.realpathSync.native`) to prevent escapes (`..`, `..\`, and reparse points).
- **Application Allowlist**: Applications can only be launched if their ID exists in the approved database allowlist.
- **Standard User Privileges**: The agent runs as a normal user process. It does not covertly install kernel drivers, bypass UAC, or modify firewall rules.

---

## 3. Network Transport & Zero Inbound Ports

- RemoteDesk recommends **Tailscale** for private-network transport over WireGuard.
- The laptop maintains an **outbound-only connection** to the server/relay via WebSockets.
- Router port forwarding is **not required**, keeping your home network closed to public port scanning.

---

## 4. Audit Trail & Non-Repudiation

All sensitive actions are recorded immutably in `audit_logs`:
- User and device authentication events
- Device enrollment and credential revocation
- File uploads, downloads, and deletions
- Application launches and PIDs
- Screenshots captured
- Workstation power operations (lock, sleep, restart, shutdown)

Audit records include timestamp, authenticated user ID, client IP address, and status (`SUCCESS` or `FAILURE`).
