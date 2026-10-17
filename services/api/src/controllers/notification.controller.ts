import { Request, Response } from 'express';
import { NotificationRepository } from '../repositories/notification.repository.js';
import { getParam } from '../utils/params.js';

export class NotificationController {
  static async list(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id || '';
    const limit = Math.min(parseInt((req.query.limit as string) || '50', 10), 100);
    const notifications = NotificationRepository.listByUserId(userId, limit);

    res.json({
      success: true,
      data: notifications,
      requestId: req.requestId,
    });
  }

  static async markRead(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id || '';
    const id = getParam(req.params.id);
    const updated = NotificationRepository.markAsRead(id, userId);

    res.json({
      success: true,
      data: { success: updated },
      requestId: req.requestId,
    });
  }

  static async markAllRead(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id || '';
    const count = NotificationRepository.markAllAsRead(userId);

    res.json({
      success: true,
      data: { markedCount: count },
      requestId: req.requestId,
    });
  }
}
