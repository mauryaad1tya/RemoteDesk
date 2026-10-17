import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/db.js';
import { User, Session } from '@remotedesk/shared';

export class UserRepository {
  static findByEmail(email: string): (User & { passwordHash: string }) | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      passwordHash: row.password_hash,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static findById(id: string): User | null {
    const db = getDatabase();
    const row = db.prepare('SELECT id, email, name, created_at, updated_at FROM users WHERE id = ?').get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static createSession(userId: string, token: string, expiresAt: string): Session {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO sessions (id, user_id, token, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, userId, token, expiresAt, now);

    return { id, userId, token, expiresAt, createdAt: now };
  }

  static findSessionByToken(token: string): Session | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token) as any;
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      token: row.token,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    };
  }

  static deleteSession(token: string): void {
    const db = getDatabase();
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  }

  static deleteExpiredSessions(): void {
    const db = getDatabase();
    db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(new Date().toISOString());
  }
}
