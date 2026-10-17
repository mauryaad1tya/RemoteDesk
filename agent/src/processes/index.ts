import si from 'systeminformation';

export interface ProcessSummary {
  pid: number;
  name: string;
  cpu: number;
  mem: number;
  state: string;
}

export class ProcessManager {
  static async listProcesses(limit: number = 25): Promise<ProcessSummary[]> {
    try {
      const data = await si.processes();
      const list = data.list
        .sort((a, b) => b.cpu - a.cpu)
        .slice(0, limit)
        .map(p => ({
          pid: p.pid,
          name: p.name,
          cpu: Math.round(p.cpu * 10) / 10,
          mem: Math.round(p.mem * 10) / 10,
          state: p.state,
        }));

      return list;
    } catch (err: any) {
      throw new Error(`Failed to list processes: ${err.message}`);
    }
  }
}
