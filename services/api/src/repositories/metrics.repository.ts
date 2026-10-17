import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/db.js';
import { SystemMetrics } from '@remotedesk/shared';

export class MetricsRepository {
  static saveMetrics(metrics: SystemMetrics): void {
    const db = getDatabase();
    const id = metrics.id || uuidv4();

    db.prepare(`
      INSERT INTO device_metrics (
        id, device_id, timestamp, cpu_json, memory_json, disks_json, battery_json, uptime_seconds, network_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      metrics.deviceId,
      metrics.timestamp,
      JSON.stringify(metrics.cpu),
      JSON.stringify(metrics.memory),
      JSON.stringify(metrics.disks),
      JSON.stringify(metrics.battery),
      metrics.uptimeSeconds,
      metrics.network ? JSON.stringify(metrics.network) : null
    );
  }

  static getLatestMetrics(deviceId: string): SystemMetrics | null {
    const db = getDatabase();
    const row = db.prepare(`
      SELECT * FROM device_metrics
      WHERE device_id = ?
      ORDER BY timestamp DESC
      LIMIT 1
    `).get(deviceId) as any;

    if (!row) return null;
    return {
      id: row.id,
      deviceId: row.device_id,
      timestamp: row.timestamp,
      cpu: JSON.parse(row.cpu_json),
      memory: JSON.parse(row.memory_json),
      disks: JSON.parse(row.disks_json),
      battery: JSON.parse(row.battery_json),
      uptimeSeconds: row.uptime_seconds,
      network: row.network_json ? JSON.parse(row.network_json) : undefined,
    };
  }

  static getMetricsHistory(deviceId: string, limit: number = 60): SystemMetrics[] {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT * FROM device_metrics
      WHERE device_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(deviceId, limit) as any[];

    // Return in chronological order for charting
    return rows.reverse().map(row => ({
      id: row.id,
      deviceId: row.device_id,
      timestamp: row.timestamp,
      cpu: JSON.parse(row.cpu_json),
      memory: JSON.parse(row.memory_json),
      disks: JSON.parse(row.disks_json),
      battery: JSON.parse(row.battery_json),
      uptimeSeconds: row.uptime_seconds,
      network: row.network_json ? JSON.parse(row.network_json) : undefined,
    }));
  }

  static pruneOldMetrics(retentionDays: number = 7): number {
    const db = getDatabase();
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
    const res = db.prepare('DELETE FROM device_metrics WHERE timestamp < ?').run(cutoff);
    return Number(res.changes);
  }
}
