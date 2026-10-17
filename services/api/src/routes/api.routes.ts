import { Router } from 'express';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { createRateLimiter } from '../middleware/rate-limiter.js';
import { AuthController } from '../controllers/auth.controller.js';
import { DeviceController } from '../controllers/device.controller.js';
import { MetricsController } from '../controllers/metrics.controller.js';
import { FileController } from '../controllers/file.controller.js';
import { AppController } from '../controllers/app.controller.js';
import { TaskController } from '../controllers/task.controller.js';
import { ScreenshotController } from '../controllers/screenshot.controller.js';
import { PowerController } from '../controllers/power.controller.js';
import { ActivityController } from '../controllers/activity.controller.js';
import { NotificationController } from '../controllers/notification.controller.js';
import { SettingsController } from '../controllers/settings.controller.js';

// Prepare upload directory
const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per upload
  },
});

export const apiRouter = Router();

// Rate limiter for authentication attempts
const authLimiter = createRateLimiter(60000, 10);

// --- 1. Authentication ---
apiRouter.post('/auth/login', authLimiter, AuthController.login);
apiRouter.post('/auth/logout', AuthController.logout);
apiRouter.get('/auth/session', authMiddleware, AuthController.session);

// --- 2. Devices ---
apiRouter.get('/devices', authMiddleware, DeviceController.list);
apiRouter.post('/devices/enroll', authMiddleware, DeviceController.enroll);
apiRouter.get('/devices/:deviceId', authMiddleware, DeviceController.get);
apiRouter.post('/devices/:deviceId/revoke', authMiddleware, DeviceController.revoke);
apiRouter.get('/devices/:deviceId/status', authMiddleware, DeviceController.status);

// --- 3. System Monitoring ---
apiRouter.get('/devices/:deviceId/metrics', authMiddleware, MetricsController.getLatest);
apiRouter.get('/devices/:deviceId/metrics/history', authMiddleware, MetricsController.getHistory);

// --- 4. Files ---
apiRouter.get('/devices/:deviceId/files', authMiddleware, FileController.browse);
apiRouter.post('/devices/:deviceId/files/upload', authMiddleware, upload.single('file'), FileController.upload);
apiRouter.get('/devices/:deviceId/files/download', authMiddleware, FileController.download);
apiRouter.post('/devices/:deviceId/files/folder', authMiddleware, FileController.createFolder);
apiRouter.patch('/devices/:deviceId/files/rename', authMiddleware, FileController.rename);
apiRouter.delete('/devices/:deviceId/files', authMiddleware, FileController.delete);

// --- 5. Applications ---
apiRouter.get('/devices/:deviceId/applications', authMiddleware, AppController.list);
apiRouter.post('/devices/:deviceId/applications/:applicationId/launch', authMiddleware, AppController.launch);

// --- 6. Tasks ---
apiRouter.get('/tasks', authMiddleware, TaskController.list);
apiRouter.get('/tasks/:taskId', authMiddleware, TaskController.get);
apiRouter.post('/devices/:deviceId/tasks', authMiddleware, TaskController.create);
apiRouter.post('/tasks/:taskId/cancel', authMiddleware, TaskController.cancel);

// --- 7. Screenshots ---
apiRouter.post('/devices/:deviceId/screenshots', authMiddleware, ScreenshotController.capture);
apiRouter.get('/screenshots/:screenshotId', authMiddleware, ScreenshotController.get);

// --- 8. Power Management ---
apiRouter.post('/devices/:deviceId/power/lock', authMiddleware, PowerController.lock);
apiRouter.post('/devices/:deviceId/power/sleep', authMiddleware, PowerController.sleep);
apiRouter.post('/devices/:deviceId/power/restart', authMiddleware, PowerController.restart);
apiRouter.post('/devices/:deviceId/power/shutdown', authMiddleware, PowerController.shutdown);

// --- 9. Activity & Notifications ---
apiRouter.get('/activity', authMiddleware, ActivityController.list);
apiRouter.get('/notifications', authMiddleware, NotificationController.list);
apiRouter.patch('/notifications/:id/read', authMiddleware, NotificationController.markRead);
apiRouter.post('/notifications/read-all', authMiddleware, NotificationController.markAllRead);

// --- 10. Settings ---
apiRouter.get('/settings', authMiddleware, SettingsController.get);
apiRouter.patch('/settings', authMiddleware, SettingsController.update);
