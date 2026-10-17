import { Request, Response } from 'express';
import { UpdateSettingsSchema } from '@remotedesk/shared';
import { SettingsRepository } from '../repositories/settings.repository.js';
import { AuditRepository } from '../repositories/audit.repository.js';

export class SettingsController {
  static async get(req: Request, res: Response): Promise<void> {
    const settings = SettingsRepository.getSettings();
    const apps = SettingsRepository.getApplicationAllowlist();
    const operations = SettingsRepository.getOperationAllowlist();

    res.json({
      success: true,
      data: {
        settings,
        applications: apps,
        operations,
      },
      requestId: req.requestId,
    });
  }

  static async update(req: Request, res: Response): Promise<void> {
    const parsed = UpdateSettingsSchema.parse(req.body);
    const updated = SettingsRepository.updateSettings(parsed);

    AuditRepository.record({
      userId: req.user?.id,
      action: 'SETTINGS_UPDATED',
      details: parsed,
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
