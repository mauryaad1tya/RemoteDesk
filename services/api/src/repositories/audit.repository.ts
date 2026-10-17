import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/db.js';
import { AuditLog } from '@remotedesk/shared';

export class AuditRepository {
  static record(data: {
    userId?: string | null;
    deviceId?: string | null;
    action: string;
    details?: Record<string, any> | null;
    ipAddress?: string | null;
    status: 'SUCCESS' | 'FAILURE';
  }): AuditLog {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO audit_logs (id, user_id, device_id, action, details_json, ip_address, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.userId || null,
      data.deviceId || null,
      data.action,
      data.details ? JSON.stringify(data.details) : null,
      data.ipAddress || null,
      data.status,
      now
    );

    return {
      id,
      userId: data.userId,
      deviceId: data.deviceId,
      action: data.action,
      details: data.details,
      ipAddress: data.ipAddress,
      status: data.status,
      createdAt: now,
    };
  }

  static listLogs(limit: number = 100): AuditLog[] {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT * FROM audit_logs
      ORDER BY created_at DESC
      LIMIT ?
    `).all(limit) as any[];

    return rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      deviceId: r.device_id,
      action: r.action,
      details: r.details_json ? JSON.parse(r.details_json) : null,
      ipAddress: r.ip_address,
      status: r.status,
      createdAt: r.created_at,
    }));
  }
}
