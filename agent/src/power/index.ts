import { exec } from 'node:child_process';
import util from 'node:util';

const execAsync = util.promisify(exec);

export class PowerManager {
  static async lockWorkstation(): Promise<{ message: string }> {
    try {
      await execAsync('rundll32.exe user32.dll,LockWorkStation');
      return { message: 'Workstation locked successfully' };
    } catch (err: any) {
      throw new Error(`Failed to lock workstation: ${err.message}`);
    }
  }

  static async sleep(): Promise<{ message: string }> {
    try {
      // Initiate Windows sleep
      await execAsync('rundll32.exe powrprof.dll,SetSuspendState 0,1,0');
      return { message: 'Laptop transitioning to sleep state' };
    } catch (err: any) {
      throw new Error(`Failed to sleep workstation: ${err.message}`);
    }
  }

  static async restart(delaySeconds: number = 5): Promise<{ message: string }> {
    try {
      // 5-second countdown to allow network response to reach server
      await execAsync(`shutdown.exe /r /t ${delaySeconds} /c "RemoteDesk requested restart"`);
      return { message: `Restart initiated. System restarting in ${delaySeconds} seconds.` };
    } catch (err: any) {
      throw new Error(`Failed to restart workstation: ${err.message}`);
    }
  }

  static async shutdown(delaySeconds: number = 5): Promise<{ message: string }> {
    try {
      await execAsync(`shutdown.exe /s /t ${delaySeconds} /c "RemoteDesk requested shutdown"`);
      return { message: `Shutdown initiated. System powering off in ${delaySeconds} seconds.` };
    } catch (err: any) {
      throw new Error(`Failed to shut down workstation: ${err.message}`);
    }
  }
}
