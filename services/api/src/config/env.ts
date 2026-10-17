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

const EnvSchema = z.object({
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  JWT_SECRET: z.string().min(16).default('remotedesk-insecure-dev-secret-key-change-in-prod'),
  COOKIE_SECRET: z.string().min(16).default('remotedesk-insecure-cookie-secret-change-in-prod'),
  DATABASE_PATH: z.string().default('./data/remotedesk.db'),
  UPLOAD_DIR: z.string().default('./data/uploads'),
  SCREENSHOT_DIR: z.string().default('./data/screenshots'),
  INITIAL_ADMIN_EMAIL: z.string().email().default('admin@remotedesk.local'),
  INITIAL_ADMIN_PASSWORD: z.string().min(8).default('RemoteDesk@Admin2025!'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(200),
});

export type Env = z.infer<typeof EnvSchema>;

export const env: Env = EnvSchema.parse(process.env);
