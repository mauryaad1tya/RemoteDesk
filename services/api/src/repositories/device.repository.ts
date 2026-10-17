import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { getDatabase } from '../database/db.js';
import { Device, DeviceCredentials, DeviceStatus, DeviceStatusType } from '@remotedesk/shared';

export class DeviceRepository {
  static listDevices(): Device[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM devices ORDER BY created_at DESC').all() as any[];
    return rows.map(r => ({
      id: r.id,
      displayName: r.display_name,
      hostname: r.hostname,
      osName: r.os_name,
      osVersion: r.os_version,
      arch: r.arch,
      agentVersion: r.agent_version,
      status: r.status as DeviceStatusType,
      lastSeenAt: r.last_seen_at,
      heartbeatAt: r.heartbeat_at,
      ipAddress: r.ip_address,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  static getDeviceById(id: string): Device | null {
    const db = getDatabase();
    const r = db.prepare('SELECT * FROM devices WHERE id = ?').get(id) as any;
    if (!r) return null;
    return {
      id: r.id,
      displayName: r.display_name,
      hostname: r.hostname,
      osName: r.os_name,
      osVersion: r.os_version,
      arch: r.arch,
      agentVersion: r.agent_version,
      status: r.status as DeviceStatusType,
      lastSeenAt: r.last_seen_at,
      heartbeatAt: r.heartbeat_at,
      ipAddress: r.ip_address,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  static createDevice(data: {
    displayName: string;
    hostname: string;
    osName: string;
    osVersion: string;
    arch: string;
    agentVersion: string;
  }): { device: Device; secretKey: string } {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();
    const secretKey = uuidv4() + '-' + uuidv4(); // Strong random secret key
    const secretHash = bcrypt.hashSync(secretKey, 10);

    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare(`
        INSERT INTO devices (
          id, display_name, hostname, os_name, os_version, arch, agent_version,
          status, last_seen_at, heartbeat_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        data.displayName,
        data.hostname,
        data.osName,
        data.osVersion,
        data.arch,
        data.agentVersion,
        DeviceStatus.OFFLINE,
        null,
        null,
        now,
        now
      );

      db.prepare(`
        INSERT INTO device_credentials (device_id, secret_hash, enrollment_token, revoked_at)
        VALUES (?, ?, NULL, NULL)
      `).run(id, secretHash);

      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }

    const device = this.getDeviceById(id)!;
    return { device, secretKey };
  }

  static verifyCredentials(deviceId: string, secretKey: string): boolean {
    const db = getDatabase();
    const creds = db.prepare('SELECT * FROM device_credentials WHERE device_id = ?').get(deviceId) as any;
    if (!creds || creds.revoked_at) return false;
    return bcrypt.compareSync(secretKey, creds.secret_hash);
  }

  static updateDeviceStatus(id: string, status: DeviceStatusType, ipAddress?: string): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    if (ipAddress) {
      db.prepare(`
        UPDATE devices
        SET status = ?, last_seen_at = ?, ip_address = ?, updated_at = ?
        WHERE id = ?
      `).run(status, now, ipAddress, now, id);
    } else {
      db.prepare(`
        UPDATE devices
        SET status = ?, last_seen_at = ?, updated_at = ?
        WHERE id = ?
      `).run(status, now, now, id);
    }
  }

  static updateHeartbeat(id: string): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE devices
      SET heartbeat_at = ?, last_seen_at = ?, status = ?, updated_at = ?
      WHERE id = ?
    `).run(now, now, DeviceStatus.ONLINE, now, id);
  }

  static revokeDevice(id: string): boolean {
    const db = getDatabase();
    const now = new Date().toISOString();
    const res = db.prepare(`
      UPDATE device_credentials
      SET revoked_at = ?
      WHERE device_id = ? AND revoked_at IS NULL
    `).run(now, id);

    if (res.changes > 0) {
      db.prepare(`
        UPDATE devices
        SET status = ?, updated_at = ?
        WHERE id = ?
      `).run(DeviceStatus.UNAUTHORIZED, now, id);
      return true;
    }
    return false;
  }

  static markStaleDevicesOffline(staleThresholdMs: number = 30000): string[] {
    const db = getDatabase();
    const cutoff = new Date(Date.now() - staleThresholdMs).toISOString();

    const staleDevices = db.prepare(`
      SELECT id FROM devices
      WHERE status = 'ONLINE' AND (heartbeat_at < ? OR heartbeat_at IS NULL)
    `).all(cutoff) as { id: string }[];

    if (staleDevices.length > 0) {
      const now = new Date().toISOString();
      for (const d of staleDevices) {
        db.prepare(`
          UPDATE devices
          SET status = ?, updated_at = ?
          WHERE id = ?
        `).run(DeviceStatus.OFFLINE, now, d.id);
      }
    }

    return staleDevices.map(d => d.id);
  }
}
