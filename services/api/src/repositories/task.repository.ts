import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/db.js';
import { Task, TaskOperationType, TaskStatus, TaskStatusType } from '@remotedesk/shared';

export class TaskRepository {
  static createTask(data: {
    deviceId: string;
    operationType: TaskOperationType;
    parameters: Record<string, any>;
    idempotencyKey?: string | null;
  }): Task {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO tasks (
        id, device_id, operation_type, status, parameters_json, result_json,
        error_message, progress_percent, idempotency_key, created_at, started_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, NULL, NULL, 0, ?, ?, NULL, NULL)
    `).run(
      id,
      data.deviceId,
      data.operationType,
      TaskStatus.PENDING,
      JSON.stringify(data.parameters || {}),
      data.idempotencyKey || null,
      now
    );

    return this.getTaskById(id)!;
  }

  static getTaskById(id: string): Task | null {
    const db = getDatabase();
    const r = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;
    if (!r) return null;
    return {
      id: r.id,
      deviceId: r.device_id,
      operationType: r.operation_type as TaskOperationType,
      status: r.status as TaskStatusType,
      parameters: JSON.parse(r.parameters_json || '{}'),
      result: r.result_json ? JSON.parse(r.result_json) : null,
      errorMessage: r.error_message,
      progressPercent: r.progress_percent,
      idempotencyKey: r.idempotency_key,
      createdAt: r.created_at,
      startedAt: r.started_at,
      completedAt: r.completed_at,
    };
  }

  static findByIdempotencyKey(key: string): Task | null {
    const db = getDatabase();
    const r = db.prepare('SELECT * FROM tasks WHERE idempotency_key = ?').get(key) as any;
    if (!r) return null;
    return this.getTaskById(r.id);
  }

  static listTasks(deviceId?: string, limit: number = 50): Task[] {
    const db = getDatabase();
    let query = 'SELECT * FROM tasks';
    const params: any[] = [];

    if (deviceId) {
      query += ' WHERE device_id = ?';
      params.push(deviceId);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const rows = db.prepare(query).all(...params) as any[];
    return rows.map(r => ({
      id: r.id,
      deviceId: r.device_id,
      operationType: r.operation_type as TaskOperationType,
      status: r.status as TaskStatusType,
      parameters: JSON.parse(r.parameters_json || '{}'),
      result: r.result_json ? JSON.parse(r.result_json) : null,
      errorMessage: r.error_message,
      progressPercent: r.progress_percent,
      idempotencyKey: r.idempotency_key,
      createdAt: r.created_at,
      startedAt: r.started_at,
      completedAt: r.completed_at,
    }));
  }

  static updateTaskStatus(
    id: string,
    status: TaskStatusType,
    progressPercent?: number,
    result?: Record<string, any> | null,
    errorMessage?: string | null
  ): Task | null {
    const db = getDatabase();
    const now = new Date().toISOString();

    const current = this.getTaskById(id);
    if (!current) return null;

    const startedAt = (status === TaskStatus.RUNNING && !current.startedAt) ? now : current.startedAt;
    const completedAt = (status === TaskStatus.COMPLETED || status === TaskStatus.FAILED || status === TaskStatus.CANCELLED || status === TaskStatus.TIMED_OUT)
      ? now
      : current.completedAt;

    db.prepare(`
      UPDATE tasks
      SET status = ?,
          progress_percent = COALESCE(?, progress_percent),
          result_json = CASE WHEN ? IS NOT NULL THEN ? ELSE result_json END,
          error_message = CASE WHEN ? IS NOT NULL THEN ? ELSE error_message END,
          started_at = ?,
          completed_at = ?
      WHERE id = ?
    `).run(
      status,
      progressPercent !== undefined ? progressPercent : null,
      result !== undefined ? 1 : null,
      result !== undefined ? JSON.stringify(result) : null,
      errorMessage !== undefined ? 1 : null,
      errorMessage !== undefined ? errorMessage : null,
      startedAt || null,
      completedAt || null,
      id
    );

    // Record task event
    db.prepare(`
      INSERT INTO task_events (id, task_id, status, details_json, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      id,
      status,
      JSON.stringify({ progressPercent, errorMessage, hasResult: !!result }),
      now
    );

    return this.getTaskById(id);
  }
}
