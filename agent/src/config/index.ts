import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { z } from 'zod';

// Load .env from workspace root or current directory
const candidateEnvPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env'),
  path.resolve(process.cwd(), '../../.env'),
  path.resolve(import.meta.dirname, '../../../.env'),
  path.resolve(import.meta.dirname, '../../.env'),
];

for (const p of candidateEnvPaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    break;
  }
}
dotenv.config();

const AgentConfigSchema = z.object({
  AGENT_API_URL: z.string().url().default('http://localhost:4000'),
  AGENT_DEVICE_ID: z.string().default(''),
  AGENT_SECRET_KEY: z.string().default(''),
  AGENT_VERSION: z.string().default('1.0.0'),
  AGENT_METRIC_INTERVAL_MS: z.coerce.number().min(2000).default(5000),
  AGENT_HEARTBEAT_INTERVAL_MS: z.coerce.number().min(3000).default(10000),
  AGENT_PERMITTED_ROOTS: z.string().default('C:\\Users,D:\\'),
  AGENT_DATA_DIR: z.string().default('./data/agent'),
});

export type AgentConfig = z.infer<typeof AgentConfigSchema> & {
  permittedRootsList: string[];
};

const parsed = AgentConfigSchema.parse(process.env);

export const agentConfig: AgentConfig = {
  ...parsed,
  permittedRootsList: parsed.AGENT_PERMITTED_ROOTS
    .split(',')
    .map(r => r.trim())
    .filter(Boolean),
};
