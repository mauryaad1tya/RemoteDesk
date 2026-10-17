import { Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { TaskOperationType } from '@remotedesk/shared';
import { executeTaskAndWait } from '../utils/task-runner.js';
import { AuditRepository } from '../repositories/audit.repository.js';
import { env } from '../config/env.js';
import { getParam } from '../utils/params.js';

const screenshotStore = new Map<string, { buffer: Buffer; mimeType: string; createdAt: string; deviceId: string }>();

export class ScreenshotController {
  static async capture(req: Request, res: Response): Promise<void> {
    const deviceId = getParam(req.params.deviceId);

    try {
      const task = await executeTaskAndWait(
        deviceId,
        TaskOperationType.SCREENSHOT,
        {},
        20000
      );

      const result = task.result as { base64Image: string; width?: number; height?: number; mimeType?: string };
      const screenshotId = uuidv4();
      const imageBuffer = Buffer.from(result.base64Image, 'base64');
      const mimeType = result.mimeType || 'image/jpeg';

      screenshotStore.set(screenshotId, {
        buffer: imageBuffer,
        mimeType,
        createdAt: new Date().toISOString(),
        deviceId,
      });

      const screenshotDir = path.resolve(process.cwd(), env.SCREENSHOT_DIR);
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }
      fs.writeFileSync(path.join(screenshotDir, `${screenshotId}.jpg`), imageBuffer);

      AuditRepository.record({
        userId: req.user?.id,
        deviceId,
        action: 'SCREENSHOT_CAPTURED',
        details: { screenshotId, sizeBytes: imageBuffer.length },
        ipAddress: req.ip,
        status: 'SUCCESS',
      });

      res.status(201).json({
        success: true,
        data: {
          screenshotId,
          url: `/api/v1/screenshots/${screenshotId}`,
          width: result.width,
          height: result.height,
          capturedAt: new Date().toISOString(),
        },
        requestId: req.requestId,
      });
    } catch (err: any) {
      AuditRepository.record({
        userId: req.user?.id,
        deviceId,
        action: 'SCREENSHOT_FAILED',
        details: { error: err.message },
        ipAddress: req.ip,
        status: 'FAILURE',
      });

      res.status(400).json({
        success: false,
        error: { code: 'SCREENSHOT_FAILED', message: err.message },
        requestId: req.requestId,
      });
    }
  }

  static async get(req: Request, res: Response): Promise<void> {
    const screenshotId = getParam(req.params.screenshotId);
    const item = screenshotStore.get(screenshotId);

    if (item) {
      res.setHeader('Content-Type', item.mimeType);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(item.buffer);
      return;
    }

    const diskPath = path.resolve(process.cwd(), env.SCREENSHOT_DIR, `${screenshotId}.jpg`);
    if (fs.existsSync(diskPath)) {
      const buffer = fs.readFileSync(diskPath);
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(buffer);
      return;
    }

    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Screenshot not found' },
      requestId: req.requestId,
    });
  }
}
