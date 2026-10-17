import { getDatabase } from '../database/db.js';
import { ApplicationItem, AllowedOperation, AppSettings } from '@remotedesk/shared';

export class SettingsRepository {
  static getSettings(): AppSettings {
    const db = getDatabase();
    const rows = db.prepare('SELECT key, value FROM app_settings').all() as { key: string; value: string }[];
    const map: Record<string, string> = {};
    for (const r of rows) {
      map[r.key] = r.value;
    }

    const permittedRootsRows = db.prepare('SELECT root_path FROM allowed_file_roots').all() as { root_path: string }[];

    return {
      heartbeatIntervalSec: parseInt(map.heartbeatIntervalSec || '10', 10),
      metricsIntervalSec: parseInt(map.metricsIntervalSec || '5', 10),
      theme: (map.theme as any) || 'dark',
      remoteDesktopUrl: map.remoteDesktopUrl || '',
      permittedRoots: permittedRootsRows.map(r => r.root_path),
    };
  }

  static updateSettings(data: Partial<AppSettings>): AppSettings {
    const db = getDatabase();
    const now = new Date().toISOString();

    db.exec('BEGIN TRANSACTION;');
    try {
      if (data.heartbeatIntervalSec !== undefined) {
        db.prepare('INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)')
          .run('heartbeatIntervalSec', data.heartbeatIntervalSec.toString(), now);
      }
      if (data.metricsIntervalSec !== undefined) {
        db.prepare('INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)')
          .run('metricsIntervalSec', data.metricsIntervalSec.toString(), now);
      }
      if (data.theme !== undefined) {
        db.prepare('INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)')
          .run('theme', data.theme, now);
      }
      if (data.remoteDesktopUrl !== undefined) {
        db.prepare('INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)')
          .run('remoteDesktopUrl', data.remoteDesktopUrl, now);
      }
      if (data.permittedRoots !== undefined) {
        // Update permitted roots
        db.prepare('DELETE FROM allowed_file_roots').run();
        const insertRoot = db.prepare('INSERT INTO allowed_file_roots (id, name, root_path, is_read_only, created_at) VALUES (?, ?, ?, 0, ?)');
        for (const root of data.permittedRoots) {
          const rootName = root.replace(/\\/g, '/').split('/').filter(Boolean).pop() || root;
          insertRoot.run(crypto.randomUUID(), rootName, root, now);
        }
      }
      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }

    return this.getSettings();
  }

  static getApplicationAllowlist(): ApplicationItem[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM application_allowlist ORDER BY name ASC').all() as any[];
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      executablePath: r.executable_path,
      iconName: r.icon_name,
      requiresAdmin: r.requires_admin === 1,
      isEnabled: r.is_enabled === 1,
    }));
  }

  static getOperationAllowlist(): AllowedOperation[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM operation_allowlist ORDER BY name ASC').all() as any[];
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      timeoutSeconds: r.timeout_seconds,
      requiresConfirmation: r.requires_confirmation === 1,
      category: r.category as any,
    }));
  }

  static getAllowedRoots(): string[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT root_path FROM allowed_file_roots').all() as { root_path: string }[];
    return rows.map(r => r.root_path);
  }
}
