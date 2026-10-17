import { getDatabase, closeDatabase } from './db.js';
import { migration001 } from './migrations/001_initial_schema.js';
import { logger } from '../utils/logger.js';

const migrations = [migration001];

export function runMigrations(): void {
  const db = getDatabase();

  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  for (const migration of migrations) {
    const existing = db.prepare('SELECT version FROM schema_migrations WHERE version = ?').get(migration.version);
    if (!existing) {
      logger.info({ version: migration.version }, 'Applying migration');
      db.exec('BEGIN TRANSACTION;');
      try {
        migration.up(db);
        db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(
          migration.version,
          new Date().toISOString()
        );
        db.exec('COMMIT;');
        logger.info({ version: migration.version }, 'Migration successfully applied');
      } catch (err) {
        db.exec('ROLLBACK;');
        logger.error({ err, version: migration.version }, 'Failed to apply migration');
        throw err;
      }
    } else {
      logger.debug({ version: migration.version }, 'Migration already applied');
    }
  }
}

// When executed directly via `npm run db:migrate`
if (process.argv[1]?.endsWith('migrate.ts') || process.argv[1]?.endsWith('migrate.js')) {
  try {
    runMigrations();
    logger.info('All migrations completed successfully.');
  } catch (error) {
    logger.error({ error }, 'Migration error');
    process.exit(1);
  } finally {
    closeDatabase();
  }
}
