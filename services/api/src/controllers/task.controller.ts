import { Request, Response } from 'express';
import { CreateTaskSchema, TaskStatus } from '@remotedesk/shared';
import { TaskRepository } from '../repositories/task.repository.js';
import { DeviceRepository } from '../repositories/device.repository.js';
import { AuditRepository } from '../repositories/audit.repository.js';
import { dispatchTaskToAgent, cancelTaskOnAgent } from '../websocket/server.js';
import { getParam } from '../utils/params.js';

export class TaskController {
  static async create(req: Request, res: Response): Promise<void> {
    const deviceId = getParam(req.params.deviceId);
    const device = DeviceRepository.getDeviceById(deviceId);

    if (!device) {
      res.status(404).json({
        success: false,
        error: { code: 'DEVICE_NOT_FOUND', message: 'Device not found.' },
        requestId: req.requestId,
      });
      return;
    }

    const parsed = CreateTaskSchema.parse(req.body);

    if (parsed.idempotencyKey) {
      const existing = TaskRepository.findByIdempotencyKey(parsed.idempotencyKey);
      if (existing) {
        res.json({
          success: true,
          data: existing,
          requestId: req.requestId,
        });
        return;
      }
    }

    const task = TaskRepository.createTask({
      deviceId,
      operationType: parsed.operationType,
      parameters: parsed.parameters,
      idempotencyKey: parsed.idempotencyKey,
    });

    AuditRepository.record({
      userId: req.user?.id,
      deviceId,
      action: 'TASK_CREATED',
      details: { taskId: task.id, operationType: task.operationType },
      ipAddress: req.ip,
      status: 'SUCCESS',
    });

    const dispatched = dispatchTaskToAgent(deviceId, task);

    res.status(202).json({
      success: true,
      data: task,
      meta: { dispatched },
      requestId: req.requestId,
    });
  }

  static async list(req: Request, res: Response): Promise<void> {
    const deviceId = req.query.deviceId as string | undefined;
    const limit = Math.min(parseInt((req.query.limit as string) || '50', 10), 100);
    const tasks = TaskRepository.listTasks(deviceId, limit);

    res.json({
      success: true,
      data: tasks,
      requestId: req.requestId,
    });
  }

  static async get(req: Request, res: Response): Promise<void> {
    const taskId = getParam(req.params.taskId);
    const task = TaskRepository.getTaskById(taskId);

    if (!task) {
      res.status(404).json({
        success: false,
        error: { code: 'TASK_NOT_FOUND', message: 'Task not found.' },
        requestId: req.requestId,
      });
      return;
    }

    res.json({
      success: true,
      data: task,
      requestId: req.requestId,
    });
  }

  static async cancel(req: Request, res: Response): Promise<void> {
    const taskId = getParam(req.params.taskId);
    const task = TaskRepository.getTaskById(taskId);

    if (!task) {
      res.status(404).json({
        success: false,
        error: { code: 'TASK_NOT_FOUND', message: 'Task not found.' },
        requestId: req.requestId,
      });
      return;
    }

    cancelTaskOnAgent(task.deviceId, taskId);
    const updated = TaskRepository.updateTaskStatus(taskId, TaskStatus.CANCELLED, undefined, null, 'Cancelled by user');

    AuditRepository.record({
      userId: req.user?.id,
      deviceId: task.deviceId,
      action: 'TASK_CANCELLED',
      details: { taskId },
      ipAddress: req.ip,
      status: 'SUCCESS',
    });

    res.json({
      success: true,
      data: updated,
      requestId: req.requestId,
    });
  }
}
