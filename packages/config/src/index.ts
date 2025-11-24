
import { config as load } from 'dotenv';
import { cleanEnv, str, num } from 'envalid';

load();

export const env = cleanEnv(process.env, {
  NODE_ENV: str({ default: 'development' }),
  LOG_LEVEL: str({ default: 'info' }),
  SERVICE_BASE_URL: str({ default: 'http://localhost' }),
  GATEWAY_PORT: num({ default: 3000 }),
  ORCHESTRATOR_PORT: num({ default: 4000 }),
  DATABASE_URL: str({ default: 'postgresql://postgres:postgres@localhost:5432/wa_platform?schema=public' }),
});
