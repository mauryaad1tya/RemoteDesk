import { Request, Response } from 'express';
import { AuditRepository } from '../repositories/audit.repository.js';

export class ActivityController {
  static async list(req: Request, res: Response): Promise<void> {
    const limit = Math.min(parseInt(req.query.limit as string || '100', 10), 500);
    const logs = AuditRepository.listLogs(limit);

    res.json({
      success: true,
      data: logs,
      requestId: req.requestId,
    });
  }
}
