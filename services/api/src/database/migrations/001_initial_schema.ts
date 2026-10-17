import { DatabaseSync } from 'node:sqlite';

export const migration001 = {
  version: '001_initial_schema',
  up: (db: DatabaseSync) => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS devices (
        id TEXT PRIMARY KEY,
        display_name TEXT NOT NULL,
        hostname TEXT NOT NULL,
        os_name TEXT NOT NULL,
        os_version TEXT NOT NULL,
        arch TEXT NOT NULL,
        agent_version TEXT NOT NULL,
        status TEXT NOT NULL,
        last_seen_at TEXT,
        heartbeat_at TEXT,
        ip_address TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS device_credentials (
        device_id TEXT PRIMARY KEY,
        secret_hash TEXT NOT NULL,
        enrollment_token TEXT,
        revoked_at TEXT,
        FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS device_metrics (
        id TEXT PRIMARY KEY,
        device_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        cpu_json TEXT NOT NULL,
        memory_json TEXT NOT NULL,
        disks_json TEXT NOT NULL,
        battery_json TEXT NOT NULL,
        uptime_seconds INTEGER NOT NULL,
        network_json TEXT,
        FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        device_id TEXT NOT NULL,
        operation_type TEXT NOT NULL,
        status TEXT NOT NULL,
        parameters_json TEXT NOT NULL,
        result_json TEXT,
        error_message TEXT,
        progress_percent REAL,
        idempotency_key TEXT UNIQUE,
        created_at TEXT NOT NULL,
        started_at TEXT,
        completed_at TEXT,
        FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS task_events (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        status TEXT NOT NULL,
        details_json TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        device_id TEXT,
        action TEXT NOT NULL,
        details_json TEXT,
        ip_address TEXT,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        severity TEXT NOT NULL,
        read INTEGER DEFAULT 0,
        metadata_json TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS application_allowlist (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        executable_path TEXT NOT NULL,
        icon_name TEXT,
        requires_admin INTEGER DEFAULT 0,
        is_enabled INTEGER DEFAULT 1,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS allowed_file_roots (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        root_path TEXT UNIQUE NOT NULL,
        is_read_only INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS operation_allowlist (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        timeout_seconds INTEGER NOT NULL,
        requires_confirmation INTEGER DEFAULT 0,
        category TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_device_metrics_time ON device_metrics(device_id, timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_tasks_device_status ON tasks(device_id, status);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
    `);
  },
};
