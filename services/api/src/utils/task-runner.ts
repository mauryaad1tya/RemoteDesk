import { TaskOperationType, TaskStatus, Task } from '@remotedesk/shared';
import { TaskRepository } from '../repositories/task.repository.js';
import { dispatchTaskToAgent } from '../websocket/server.js';
import { EventEmitter } from 'node:events';

export const taskEvents = new EventEmitter();
taskEvents.setMaxListeners(200);

// Notify listeners whenever task repository updates status
export function notifyTaskEvent(task: Task): void {
  taskEvents.emit(`task:${task.id}`, task);
}

export async function executeTaskAndWait(
  deviceId: string,
  operationType: TaskOperationType,
  parameters: Record<string, any>,
  timeoutMs: number = 20000
): Promise<Task> {
  const task = TaskRepository.createTask({
    deviceId,
    operationType,
    parameters,
  });

  const dispatched = dispatchTaskToAgent(deviceId, task);
  if (!dispatched) {
    throw new Error('Device agent is currently offline or unreachable');
  }

  return new Promise<Task>((resolve, reject) => {
    let timer: NodeJS.Timeout;

    const cleanup = () => {
      clearTimeout(timer);
      taskEvents.off(`task:${task.id}`, onUpdate);
    };

    const onUpdate = (updatedTask: Task) => {
      if (
        updatedTask.status === TaskStatus.COMPLETED ||
        updatedTask.status === TaskStatus.FAILED ||
        updatedTask.status === TaskStatus.CANCELLED ||
        updatedTask.status === TaskStatus.TIMED_OUT
      ) {
        cleanup();
        if (updatedTask.status === TaskStatus.COMPLETED) {
          resolve(updatedTask);
        } else {
          reject(new Error(updatedTask.errorMessage || `Task failed with status ${updatedTask.status}`));
        }
      }
    };

    taskEvents.on(`task:${task.id}`, onUpdate);

    timer = setTimeout(() => {
      cleanup();
      TaskRepository.updateTaskStatus(task.id, TaskStatus.TIMED_OUT, undefined, null, 'Operation timed out waiting for agent');
      reject(new Error('Operation timed out waiting for Windows agent response'));
    }, timeoutMs);
  });
}
