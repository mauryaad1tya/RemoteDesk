import { Request, Response } from 'express';
import { PowerActionSchema, TaskOperationType } from '@remotedesk/shared';
import { executeTaskAndWait } from '../utils/task-runner.js';
import { AuditRepository } from '../repositories/audit.repository.js';
import { getParam } from '../utils/params.js';

export class PowerController {
  static async lock(req: Request, res: Response): Promise<void> {
    const deviceId = getParam(req.params.deviceId);
    PowerActionSchema.parse({ action: 'LOCK', ...req.body });

    try {
      const task = await executeTaskAndWait(
        deviceId,
        TaskOperationType.POWER_LOCK,
        {},
        10000
      );

      AuditRepository.record({
        userId: req.user?.id,
        deviceId,
        action: 'POWER_LOCK_EXECUTED',
        ipAddress: req.ip,
        status: 'SUCCESS',
      });

      res.json({
        success: true,
        data: task.result || { message: 'Workstation locked' },
        requestId: req.requestId,
      });
    } catch (err: any) {
      AuditRepository.record({
        userId: req.user?.id,
        deviceId,
        action: 'POWER_LOCK_FAILED',
        details: { error: err.message },
        ipAddress: req.ip,
        status: 'FAILURE',
      });

      res.status(400).json({
        success: false,
        error: { code: 'POWER_LOCK_FAILED', message: err.message },
        requestId: req.requestId,
      });
    }
  }

  static async sleep(req: Request, res: Response): Promise<void> {
    const deviceId = getParam(req.params.deviceId);
    PowerActionSchema.parse({ action: 'SLEEP', ...req.body });

    try {
      const task = await executeTaskAndWait(
        deviceId,
        TaskOperationType.POWER_SLEEP,
        {},
        10000
      );

      AuditRepository.record({
        userId: req.user?.id,
        deviceId,
        action: 'POWER_SLEEP_EXECUTED',
        ipAddress: req.ip,
        status: 'SUCCESS',
      });

      res.json({
        success: true,
        data: task.result || { message: 'Laptop transitioning to sleep state' },
        requestId: req.requestId,
      });
    } catch (err: any) {
      AuditRepository.record({
        userId: req.user?.id,
        deviceId,
        action: 'POWER_SLEEP_FAILED',
        details: { error: err.message },
        ipAddress: req.ip,
        status: 'FAILURE',
      });

      res.status(400).json({
        success: false,
        error: { code: 'POWER_SLEEP_FAILED', message: err.message },
        requestId: req.requestId,
      });
    }
  }

  static async restart(req: Request, res: Response): Promise<void> {
    const deviceId = getParam(req.params.deviceId);
    PowerActionSchema.parse({ action: 'RESTART', ...req.body });

    try {
      const task = await executeTaskAndWait(
        deviceId,
        TaskOperationType.POWER_RESTART,
        {},
        10000
      );

      AuditRepository.record({
        userId: req.user?.id,
        deviceId,
        action: 'POWER_RESTART_REQUESTED',
        ipAddress: req.ip,
        status: 'SUCCESS',
      });

      res.json({
        success: true,
        data: task.result || { message: 'Laptop restart initiated. Connection will disconnect shortly.' },
        requestId: req.requestId,
      });
    } catch (err: any) {
      AuditRepository.record({
        userId: req.user?.id,
        deviceId,
        action: 'POWER_RESTART_FAILED',
        details: { error: err.message },
        ipAddress: req.ip,
        status: 'FAILURE',
      });

      res.status(400).json({
        success: false,
        error: { code: 'POWER_RESTART_FAILED', message: err.message },
        requestId: req.requestId,
      });
    }
  }

  static async shutdown(req: Request, res: Response): Promise<void> {
    const deviceId = getParam(req.params.deviceId);
    PowerActionSchema.parse({ action: 'SHUTDOWN', ...req.body });

    try {
      const task = await executeTaskAndWait(
        deviceId,
        TaskOperationType.POWER_SHUTDOWN,
        {},
        10000
      );

      AuditRepository.record({
        userId: req.user?.id,
        deviceId,
        action: 'POWER_SHUTDOWN_REQUESTED',
        ipAddress: req.ip,
        status: 'SUCCESS',
      });

      res.json({
        success: true,
        data: task.result || { message: 'Laptop shutdown initiated. Connection will disconnect shortly.' },
        requestId: req.requestId,
      });
    } catch (err: any) {
      AuditRepository.record({
        userId: req.user?.id,
        deviceId,
        action: 'POWER_SHUTDOWN_FAILED',
        details: { error: err.message },
        ipAddress: req.ip,
        status: 'FAILURE',
      });

      res.status(400).json({
        success: false,
        error: { code: 'POWER_SHUTDOWN_FAILED', message: err.message },
        requestId: req.requestId,
      });
    }
  }
}
