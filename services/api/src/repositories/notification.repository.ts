import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/db.js';
import { NotificationItem, NotificationSeverityType } from '@remotedesk/shared';

export class NotificationRepository {
  static create(data: {
    userId: string;
    title: string;
    message: string;
    severity: NotificationSeverityType;
    metadata?: Record<string, any> | null;
  }): NotificationItem {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, severity, read, metadata_json, created_at)
      VALUES (?, ?, ?, ?, ?, 0, ?, ?)
    `).run(
      id,
      data.userId,
      data.title,
      data.message,
      data.severity,
      data.metadata ? JSON.stringify(data.metadata) : null,
      now
    );

    return {
      id,
      userId: data.userId,
      title: data.title,
      message: data.message,
      severity: data.severity,
      read: false,
      metadata: data.metadata,
      createdAt: now,
    };
  }

  static listByUserId(userId: string, limit: number = 50): NotificationItem[] {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(userId, limit) as any[];

    return rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      title: r.title,
      message: r.message,
      severity: r.severity as NotificationSeverityType,
      read: r.read === 1,
      metadata: r.metadata_json ? JSON.parse(r.metadata_json) : null,
      createdAt: r.created_at,
    }));
  }

  static markAsRead(id: string, userId: string): boolean {
    const db = getDatabase();
    const res = db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?').run(id, userId);
    return res.changes > 0;
  }

  static markAllAsRead(userId: string): number {
    const db = getDatabase();
    const res = db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(userId);
    return Number(res.changes);
  }
}
