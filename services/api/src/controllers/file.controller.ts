import { Request, Response } from 'express';
import fs from 'node:fs';
import {
  BrowseFilesSchema,
  CreateFolderSchema,
  RenameFileSchema,
  DeleteFileSchema,
  TaskOperationType,
} from '@remotedesk/shared';
import { executeTaskAndWait } from '../utils/task-runner.js';
import { AuditRepository } from '../repositories/audit.repository.js';
import { DeviceRepository } from '../repositories/device.repository.js';
import { getParam } from '../utils/params.js';

export class FileController {
  static async browse(req: Request, res: Response): Promise<void> {
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

    const queryPath = (req.query.path as string) || '';
    const parsed = BrowseFilesSchema.parse({ path: queryPath });

    try {
      const task = await executeTaskAndWait(
        deviceId,
        TaskOperationType.SYSTEM_INFO,
        { action: 'FILE_BROWSE', path: parsed.path },
        15000
      );

      res.json({
        success: true,
        data: task.result,
        requestId: req.requestId,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { code: 'FILE_BROWSE_FAILED', message: err.message },
        requestId: req.requestId,
      });
    }
  }

  static async createFolder(req: Request, res: Response): Promise<void> {
    const deviceId = getParam(req.params.deviceId);
    const parsed = CreateFolderSchema.parse(req.body);

    try {
      const task = await executeTaskAndWait(
        deviceId,
        TaskOperationType.FILE_MKDIR,
        { parentPath: parsed.parentPath, name: parsed.name },
        15000
      );

      AuditRepository.record({
        userId: req.user?.id,
        deviceId,
        action: 'FILE_FOLDER_CREATED',
        details: { parentPath: parsed.parentPath, name: parsed.name },
        ipAddress: req.ip,
        status: 'SUCCESS',
      });

      res.status(201).json({
        success: true,
        data: task.result,
        requestId: req.requestId,
      });
    } catch (err: any) {
      AuditRepository.record({
        userId: req.user?.id,
        deviceId,
        action: 'FILE_FOLDER_CREATED',
        details: { parentPath: parsed.parentPath, name: parsed.name, error: err.message },
        ipAddress: req.ip,
        status: 'FAILURE',
      });

      res.status(400).json({
        success: false,
        error: { code: 'FOLDER_CREATE_FAILED', message: err.message },
        requestId: req.requestId,
      });
    }
  }

  static async rename(req: Request, res: Response): Promise<void> {
    const deviceId = getParam(req.params.deviceId);
    const parsed = RenameFileSchema.parse(req.body);

    try {
      const task = await executeTaskAndWait(
        deviceId,
        TaskOperationType.FILE_RENAME,
        { currentPath: parsed.currentPath, newName: parsed.newName },
        15000
      );

      AuditRepository.record({
        userId: req.user?.id,
        deviceId,
        action: 'FILE_RENAMED',
        details: { currentPath: parsed.currentPath, newName: parsed.newName },
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
        action: 'FILE_RENAMED',
        details: { currentPath: parsed.currentPath, newName: parsed.newName, error: err.message },
        ipAddress: req.ip,
        status: 'FAILURE',
      });

      res.status(400).json({
        success: false,
        error: { code: 'FILE_RENAME_FAILED', message: err.message },
        requestId: req.requestId,
      });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    const deviceId = getParam(req.params.deviceId);
    const parsed = DeleteFileSchema.parse(req.body);

    try {
      const task = await executeTaskAndWait(
        deviceId,
        TaskOperationType.FILE_DELETE,
        { path: parsed.path },
        15000
      );

      AuditRepository.record({
        userId: req.user?.id,
        deviceId,
        action: 'FILE_DELETED',
        details: { path: parsed.path },
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
        action: 'FILE_DELETED',
        details: { path: parsed.path, error: err.message },
        ipAddress: req.ip,
        status: 'FAILURE',
      });

      res.status(400).json({
        success: false,
        error: { code: 'FILE_DELETE_FAILED', message: err.message },
        requestId: req.requestId,
      });
    }
  }

  static async upload(req: Request, res: Response): Promise<void> {
    const deviceId = getParam(req.params.deviceId);
    const targetDir = req.body.targetDir as string;
    const file = req.file;

    if (!file) {
      res.status(400).json({
        success: false,
        error: { code: 'NO_FILE_UPLOADED', message: 'No file was provided in the upload request' },
        requestId: req.requestId,
      });
      return;
    }

    if (!targetDir) {
      fs.unlinkSync(file.path);
      res.status(400).json({
        success: false,
        error: { code: 'TARGET_DIR_REQUIRED', message: 'Target directory must be specified' },
        requestId: req.requestId,
      });
      return;
    }

    try {
      const fileBuffer = fs.readFileSync(file.path);
      const base64Data = fileBuffer.toString('base64');

      const task = await executeTaskAndWait(
        deviceId,
        TaskOperationType.FILE_UPLOAD,
        {
          targetDir,
          fileName: file.originalname,
          sizeBytes: file.size,
          base64Content: base64Data,
        },
        30000
      );

      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      AuditRepository.record({
        userId: req.user?.id,
        deviceId,
        action: 'FILE_UPLOADED',
        details: { targetDir, fileName: file.originalname, size: file.size },
        ipAddress: req.ip,
        status: 'SUCCESS',
      });

      res.status(201).json({
        success: true,
        data: task.result,
        requestId: req.requestId,
      });
    } catch (err: any) {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      AuditRepository.record({
        userId: req.user?.id,
        deviceId,
        action: 'FILE_UPLOADED',
        details: { targetDir, fileName: file.originalname, error: err.message },
        ipAddress: req.ip,
        status: 'FAILURE',
      });

      res.status(400).json({
        success: false,
        error: { code: 'FILE_UPLOAD_FAILED', message: err.message },
        requestId: req.requestId,
      });
    }
  }

  static async download(req: Request, res: Response): Promise<void> {
    const deviceId = getParam(req.params.deviceId);
    const filePath = req.query.path as string;

    if (!filePath) {
      res.status(400).json({
        success: false,
        error: { code: 'PATH_REQUIRED', message: 'File path parameter is required' },
        requestId: req.requestId,
      });
      return;
    }

    try {
      const task = await executeTaskAndWait(
        deviceId,
        TaskOperationType.FILE_DOWNLOAD,
        { path: filePath },
        30000
      );

      const result = task.result as { fileName: string; sizeBytes: number; base64Content: string; mimeType?: string };
      const fileBuffer = Buffer.from(result.base64Content, 'base64');

      AuditRepository.record({
        userId: req.user?.id,
        deviceId,
        action: 'FILE_DOWNLOADED',
        details: { path: filePath, size: result.sizeBytes },
        ipAddress: req.ip,
        status: 'SUCCESS',
      });

      res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
      res.setHeader('Content-Type', result.mimeType || 'application/octet-stream');
      res.setHeader('Content-Length', fileBuffer.length);
      res.send(fileBuffer);
    } catch (err: any) {
      AuditRepository.record({
        userId: req.user?.id,
        deviceId,
        action: 'FILE_DOWNLOADED',
        details: { path: filePath, error: err.message },
        ipAddress: req.ip,
        status: 'FAILURE',
      });

      res.status(400).json({
        success: false,
        error: { code: 'FILE_DOWNLOAD_FAILED', message: err.message },
        requestId: req.requestId,
      });
    }
  }
}
