import { Request, Response } from 'express';
import { TaskOperationType, LaunchAppSchema } from '@remotedesk/shared';
import { SettingsRepository } from '../repositories/settings.repository.js';
import { AuditRepository } from '../repositories/audit.repository.js';
import { executeTaskAndWait } from '../utils/task-runner.js';
import { getParam } from '../utils/params.js';

export class AppController {
  static async list(req: Request, res: Response): Promise<void> {
    const apps = SettingsRepository.getApplicationAllowlist();
    res.json({
      success: true,
      data: apps,
      requestId: req.requestId,
    });
  }

  static async launch(req: Request, res: Response): Promise<void> {
    const deviceId = getParam(req.params.deviceId);
    const applicationId = getParam(req.params.applicationId);
    const parsed = LaunchAppSchema.parse({ applicationId, ...req.body });

    const apps = SettingsRepository.getApplicationAllowlist();
    const app = apps.find(a => a.id === parsed.applicationId && a.isEnabled);

    if (!app) {
      AuditRepository.record({
        userId: req.user?.id,
        deviceId,
        action: 'APP_LAUNCH_UNAUTHORIZED',
        details: { applicationId: parsed.applicationId },
        ipAddress: req.ip,
        status: 'FAILURE',
      });

      res.status(403).json({
        success: false,
        error: { code: 'APP_NOT_PERMITTED', message: 'Application is not in the approved allowlist or is disabled.' },
        requestId: req.requestId,
      });
      return;
    }

    try {
      const task = await executeTaskAndWait(
        deviceId,
        TaskOperationType.APP_LAUNCH,
        {
          applicationId: app.id,
          executablePath: app.executablePath,
          appName: app.name,
          args: parsed.args || [],
        },
        15000
      );

      AuditRepository.record({
        userId: req.user?.id,
        deviceId,
        action: 'APP_LAUNCHED',
        details: { applicationId: app.id, name: app.name, processId: task.result?.processId },
        ipAddress: req.ip,
        status: 'SUCCESS',
      });

      res.json({
        success: true,
        data: task.result,
        requestId: req.requestId,
      });
    } catch (err: any) {
      AuditRepository.record({
        userId: req.user?.id,
        deviceId,
        action: 'APP_LAUNCH_FAILED',
        details: { applicationId: app.id, error: err.message },
        ipAddress: req.ip,
        status: 'FAILURE',
      });

      res.status(400).json({
        success: false,
        error: { code: 'APP_LAUNCH_FAILED', message: err.message },
        requestId: req.requestId,
      });
    }
  }
}
