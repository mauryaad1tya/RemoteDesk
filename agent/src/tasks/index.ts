import si from 'systeminformation';
import dns from 'node:dns/promises';
import { Task, TaskOperationType, TaskStatus } from '@remotedesk/shared';
import { getSystemInfo } from '../system/index.js';
import { FileOperations } from '../files/index.js';
import { ProcessManager } from '../processes/index.js';
import { ApplicationLauncher } from '../applications/index.js';
import { PowerManager } from '../power/index.js';
import { ScreenshotManager } from '../screenshots/index.js';

export interface TaskUpdateCallback {
  (update: {
    taskId: string;
    deviceId: string;
    status: typeof TaskStatus[keyof typeof TaskStatus];
    progressPercent?: number;
    result?: Record<string, any> | null;
    errorMessage?: string | null;
  }): void;
}

export class TaskExecutor {
  private static activeTasks = new Set<string>();

  static cancel(taskId: string): boolean {
    if (this.activeTasks.has(taskId)) {
      this.activeTasks.delete(taskId);
      return true;
    }
    return false;
  }

  static async execute(task: Task, onUpdate: TaskUpdateCallback): Promise<void> {
    const { id: taskId, deviceId, operationType, parameters } = task;
    this.activeTasks.add(taskId);

    onUpdate({
      taskId,
      deviceId,
      status: TaskStatus.RUNNING,
      progressPercent: 15,
    });

    try {
      let result: Record<string, any> = {};

      switch (operationType) {
        case TaskOperationType.SYSTEM_INFO: {
          if (parameters.action === 'FILE_BROWSE') {
            result = FileOperations.browseDirectory(parameters.path);
          } else {
            result = getSystemInfo();
          }
          break;
        }

        case TaskOperationType.LIST_PROCESSES: {
          const limit = parameters.limit || 30;
          const processes = await ProcessManager.listProcesses(limit);
          result = { processes };
          break;
        }

        case TaskOperationType.DISK_USAGE: {
          const fsSize = await si.fsSize();
          result = { disks: fsSize };
          break;
        }

        case TaskOperationType.NETWORK_CONNECTIVITY: {
          let canResolveDns = false;
          try {
            await dns.lookup('cloudflare.com');
            canResolveDns = true;
          } catch {
            canResolveDns = false;
          }

          const defaultGateway = await si.networkGatewayDefault().catch(() => 'Unknown');
          result = {
            internetReachable: canResolveDns,
            defaultGateway,
            testedAt: new Date().toISOString(),
          };
          break;
        }

        case TaskOperationType.APP_LAUNCH: {
          if (!parameters.executablePath) {
            throw new Error('Executable path is required for launch');
          }
          result = ApplicationLauncher.launch(parameters.executablePath, parameters.args || []);
          break;
        }

        case TaskOperationType.SCREENSHOT: {
          result = await ScreenshotManager.capture();
          break;
        }

        case TaskOperationType.FILE_UPLOAD: {
          result = FileOperations.writeFile(
            parameters.targetDir,
            parameters.fileName,
            parameters.base64Content
          );
          break;
        }

        case TaskOperationType.FILE_DOWNLOAD: {
          result = FileOperations.readFile(parameters.path);
          break;
        }

        case TaskOperationType.FILE_MKDIR: {
          result = FileOperations.createFolder(parameters.parentPath, parameters.name);
          break;
        }

        case TaskOperationType.FILE_RENAME: {
          result = FileOperations.renameItem(parameters.currentPath, parameters.newName);
          break;
        }

        case TaskOperationType.FILE_DELETE: {
          result = FileOperations.deleteItem(parameters.path);
          break;
        }

        case TaskOperationType.POWER_LOCK: {
          result = await PowerManager.lockWorkstation();
          break;
        }

        case TaskOperationType.POWER_SLEEP: {
          result = await PowerManager.sleep();
          break;
        }

        case TaskOperationType.POWER_RESTART: {
          result = await PowerManager.restart(parameters.delaySeconds || 5);
          break;
        }

        case TaskOperationType.POWER_SHUTDOWN: {
          result = await PowerManager.shutdown(parameters.delaySeconds || 5);
          break;
        }

        default:
          throw new Error(`Unsupported task operation: ${operationType}`);
      }

      // Check if task was cancelled while executing
      if (!this.activeTasks.has(taskId)) {
        onUpdate({
          taskId,
          deviceId,
          status: TaskStatus.CANCELLED,
          errorMessage: 'Task was cancelled by user',
        });
        return;
      }

      this.activeTasks.delete(taskId);

      onUpdate({
        taskId,
        deviceId,
        status: TaskStatus.COMPLETED,
        progressPercent: 100,
        result,
      });
    } catch (err: any) {
      this.activeTasks.delete(taskId);

      onUpdate({
        taskId,
        deviceId,
        status: TaskStatus.FAILED,
        errorMessage: err.message || 'Operation failed',
      });
    }
  }
}
