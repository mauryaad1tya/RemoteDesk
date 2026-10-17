import { spawn } from 'node:child_process';

export class ApplicationLauncher {
  static launch(executablePath: string, args: string[] = []): { success: boolean; processId?: number; message: string } {
    try {
      const child = spawn(executablePath, args, {
        detached: true,
        stdio: 'ignore',
        shell: false,
      });

      child.unref();

      return {
        success: true,
        processId: child.pid,
        message: `Application launched successfully (PID: ${child.pid})`,
      };
    } catch (err: any) {
      throw new Error(`Failed to launch application: ${err.message}`);
    }
  }
}
