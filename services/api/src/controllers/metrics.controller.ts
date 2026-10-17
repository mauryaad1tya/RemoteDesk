import { Request, Response } from 'express';
import { MetricsRepository } from '../repositories/metrics.repository.js';
import { DeviceRepository } from '../repositories/device.repository.js';
import { getParam } from '../utils/params.js';

export class MetricsController {
  static async getLatest(req: Request, res: Response): Promise<void> {
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

    const metrics = MetricsRepository.getLatestMetrics(deviceId);
    res.json({
      success: true,
      data: metrics,
      requestId: req.requestId,
    });
  }

  static async getHistory(req: Request, res: Response): Promise<void> {
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

    const limit = Math.min(parseInt((req.query.limit as string) || '60', 10), 300);
    const history = MetricsRepository.getMetricsHistory(deviceId, limit);

    res.json({
      success: true,
      data: history,
      requestId: req.requestId,
    });
  }
}
