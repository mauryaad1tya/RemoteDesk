import { Request, Response } from 'express';
import { EnrollDeviceSchema, DeviceStatus } from '@remotedesk/shared';
import { DeviceRepository } from '../repositories/device.repository.js';
import { MetricsRepository } from '../repositories/metrics.repository.js';
import { AuditRepository } from '../repositories/audit.repository.js';
import { isAgentConnected } from '../websocket/server.js';
import { getParam } from '../utils/params.js';

export class DeviceController {
  static async list(req: Request, res: Response): Promise<void> {
    const devices = DeviceRepository.listDevices();
    const enriched = devices.map(d => ({
      ...d,
      isOnline: isAgentConnected(d.id) && d.status === DeviceStatus.ONLINE,
    }));

    res.json({
      success: true,
      data: enriched,
      requestId: req.requestId,
    });
  }

  static async get(req: Request, res: Response): Promise<void> {
    const deviceId = getParam(req.params.deviceId);
    const device = DeviceRepository.getDeviceById(deviceId);

    if (!device) {
      res.status(404).json({
        success: false,
        error: { code: 'DEVICE_NOT_FOUND', message: 'The requested device was not found.' },
        requestId: req.requestId,
      });
      return;
    }

    const latestMetrics = MetricsRepository.getLatestMetrics(deviceId);
    res.json({
      success: true,
      data: {
        ...device,
        isOnline: isAgentConnected(device.id) && device.status === DeviceStatus.ONLINE,
        latestMetrics,
      },
      requestId: req.requestId,
    });
  }

  static async enroll(req: Request, res: Response): Promise<void> {
    const parsed = EnrollDeviceSchema.parse(req.body);
    const { device, secretKey } = DeviceRepository.createDevice(parsed);

    AuditRepository.record({
      userId: req.user?.id,
      deviceId: device.id,
      action: 'DEVICE_ENROLLED',
      details: { displayName: device.displayName, hostname: device.hostname },
      ipAddress: req.ip,
      status: 'SUCCESS',
    });

    res.status(201).json({
      success: true,
      data: {
        device,
        credentials: {
          deviceId: device.id,
          secretKey,
        },
        setupInstructions: 'Configure these credentials in your Windows Agent .env file or startup config.',
      },
      requestId: req.requestId,
    });
  }

  static async revoke(req: Request, res: Response): Promise<void> {
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

    DeviceRepository.revokeDevice(deviceId);

    AuditRepository.record({
      userId: req.user?.id,
      deviceId,
      action: 'DEVICE_REVOKED',
      details: { displayName: device.displayName },
      ipAddress: req.ip,
      status: 'SUCCESS',
    });

    res.json({
      success: true,
      data: { message: 'Device credentials successfully revoked.' },
      requestId: req.requestId,
    });
  }

  static async status(req: Request, res: Response): Promise<void> {
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

    const connected = isAgentConnected(deviceId);
    res.json({
      success: true,
      data: {
        deviceId: device.id,
        status: connected ? DeviceStatus.ONLINE : device.status,
        lastSeenAt: device.lastSeenAt,
        heartbeatAt: device.heartbeatAt,
      },
      requestId: req.requestId,
    });
  }
}
