// packages/config/src/index.ts
import { config as load } from 'dotenv';

load(); // 루트 .env 읽기

type Env = {
  NODE_ENV: string;
  SERVICE_BASE_URL: string;
  GATEWAY_PORT: number;
  ORCHESTRATOR_PORT: number;
  DATABASE_URL: string;
  LOG_LEVEL: string;
};

export const env: Env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  SERVICE_BASE_URL: process.env.SERVICE_BASE_URL ?? 'http://localhost',
  GATEWAY_PORT: Number(process.env.GATEWAY_PORT ?? '3000'),
  ORCHESTRATOR_PORT: Number(process.env.ORCHESTRATOR_PORT ?? '4000'),
  DATABASE_URL:
    process.env.DATABASE_URL ??
    'postgresql://wauser:wapass@localhost:5432/wa_platform?schema=public',
  LOG_LEVEL: process.env.LOG_LEVEL ?? 'info',
};
