import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase, closeDatabase } from './db.js';
import { runMigrations } from './migrate.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export function runSeeds(): void {
  // Ensure migrations are run first
  runMigrations();

  const db = getDatabase();
  const now = new Date().toISOString();

  // 1. Seed initial admin user if no users exist
  const existingUser = db.prepare('SELECT id FROM users LIMIT 1').get();
  if (!existingUser) {
    const salt = bcrypt.genSaltSync(12);
    const passwordHash = bcrypt.hashSync(env.INITIAL_ADMIN_PASSWORD, salt);
    const userId = uuidv4();

    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, env.INITIAL_ADMIN_EMAIL, passwordHash, 'System Owner', now, now);

    logger.info({ email: env.INITIAL_ADMIN_EMAIL }, 'Seeded initial admin user');
  }

  // 2. Seed approved applications
  const existingApps = db.prepare('SELECT count(*) as count FROM application_allowlist').get() as { count: number };
  if (existingApps.count === 0) {
    const defaultApps = [
      {
        id: 'notepad',
        name: 'Notepad',
        description: 'Windows Text Editor',
        executablePath: 'notepad.exe',
        iconName: 'FileText',
        requiresAdmin: 0,
      },
      {
        id: 'calculator',
        name: 'Calculator',
        description: 'Windows Calculator',
        executablePath: 'calc.exe',
        iconName: 'Calculator',
        requiresAdmin: 0,
      },
      {
        id: 'explorer',
        name: 'File Explorer',
        description: 'Windows File Explorer',
        executablePath: 'explorer.exe',
        iconName: 'Folder',
        requiresAdmin: 0,
      },
      {
        id: 'taskmgr',
        name: 'Task Manager',
        description: 'Windows System Task Manager',
        executablePath: 'taskmgr.exe',
        iconName: 'Activity',
        requiresAdmin: 0,
      },
      {
        id: 'cmd',
        name: 'Command Prompt',
        description: 'Standard Windows Command Prompt',
        executablePath: 'cmd.exe',
        iconName: 'Terminal',
        requiresAdmin: 0,
      },
    ];

    const insertApp = db.prepare(`
      INSERT INTO application_allowlist (id, name, description, executable_path, icon_name, requires_admin, is_enabled, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `);

    for (const app of defaultApps) {
      insertApp.run(app.id, app.name, app.description, app.executablePath, app.iconName, app.requiresAdmin, now);
    }
    logger.info('Seeded default application allowlist');
  }

  // 3. Seed allowed file roots
  const existingRoots = db.prepare('SELECT count(*) as count FROM allowed_file_roots').get() as { count: number };
  if (existingRoots.count === 0) {
    const defaultRoots = [
      { id: uuidv4(), name: 'User Profile', rootPath: 'C:\\Users' },
      { id: uuidv4(), name: 'Secondary Drive D', rootPath: 'D:\\' },
    ];

    const insertRoot = db.prepare(`
      INSERT INTO allowed_file_roots (id, name, root_path, is_read_only, created_at)
      VALUES (?, ?, ?, 0, ?)
    `);

    for (const root of defaultRoots) {
      insertRoot.run(root.id, root.name, root.rootPath, now);
    }
    logger.info('Seeded allowed file roots');
  }

  // 4. Seed operation allowlist
  const existingOps = db.prepare('SELECT count(*) as count FROM operation_allowlist').get() as { count: number };
  if (existingOps.count === 0) {
    const defaultOps = [
      {
        id: 'SYSTEM_INFO',
        name: 'Query System Info',
        description: 'Collect hardware, OS version, and uptime information',
        timeoutSeconds: 15,
        requiresConfirmation: 0,
        category: 'SYSTEM',
      },
      {
        id: 'LIST_PROCESSES',
        name: 'List Active Processes',
        description: 'List top running processes and resource consumption',
        timeoutSeconds: 20,
        requiresConfirmation: 0,
        category: 'DIAGNOSTIC',
      },
      {
        id: 'DISK_USAGE',
        name: 'Analyze Disk Usage',
        description: 'Check free and used storage across all mounted partitions',
        timeoutSeconds: 15,
        requiresConfirmation: 0,
        category: 'SYSTEM',
      },
      {
        id: 'NETWORK_CONNECTIVITY',
        name: 'Test Network Connectivity',
        description: 'Ping standard gateway and public DNS to verify internet reachability',
        timeoutSeconds: 25,
        requiresConfirmation: 0,
        category: 'NETWORK',
      },
      {
        id: 'POWER_LOCK',
        name: 'Lock Workstation',
        description: 'Immediately lock the Windows workstation session',
        timeoutSeconds: 10,
        requiresConfirmation: 1,
        category: 'MAINTENANCE',
      },
      {
        id: 'POWER_SLEEP',
        name: 'Put Laptop to Sleep',
        description: 'Transition laptop into low-power sleep state',
        timeoutSeconds: 10,
        requiresConfirmation: 1,
        category: 'MAINTENANCE',
      },
      {
        id: 'POWER_RESTART',
        name: 'Restart Laptop',
        description: 'Safely restart the Windows operating system',
        timeoutSeconds: 15,
        requiresConfirmation: 1,
        category: 'MAINTENANCE',
      },
      {
        id: 'POWER_SHUTDOWN',
        name: 'Shut Down Laptop',
        description: 'Safely power off the laptop',
        timeoutSeconds: 15,
        requiresConfirmation: 1,
        category: 'MAINTENANCE',
      },
    ];

    const insertOp = db.prepare(`
      INSERT INTO operation_allowlist (id, name, description, timeout_seconds, requires_confirmation, category, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const op of defaultOps) {
      insertOp.run(op.id, op.name, op.description, op.timeoutSeconds, op.requiresConfirmation, op.category, now);
    }
    logger.info('Seeded default operation allowlist');
  }

  // 5. Seed default app settings
  const existingSettings = db.prepare('SELECT count(*) as count FROM app_settings').get() as { count: number };
  if (existingSettings.count === 0) {
    const defaultSettings = [
      { key: 'heartbeatIntervalSec', value: '10' },
      { key: 'metricsIntervalSec', value: '5' },
      { key: 'theme', value: 'dark' },
      { key: 'remoteDesktopUrl', value: '' },
    ];

    const insertSetting = db.prepare(`
      INSERT INTO app_settings (key, value, updated_at)
      VALUES (?, ?, ?)
    `);

    for (const s of defaultSettings) {
      insertSetting.run(s.key, s.value, now);
    }
    logger.info('Seeded default application settings');
  }
}

// When executed directly via `npm run db:seed`
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  try {
    runSeeds();
    logger.info('Database seeding completed successfully.');
  } catch (error) {
    logger.error({ error }, 'Seeding error');
    process.exit(1);
  } finally {
    closeDatabase();
  }
}
