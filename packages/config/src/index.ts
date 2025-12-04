// packages/config/src/index.ts
import { config as load } from "dotenv";
import path from "path";

/**
 * 현재 __dirname 은 빌드 후에는
 * /packages/config/dist 기준이 된다.
 *
 * dist → config → packages → wa-platform 프로젝트 루트
 * ../../.. 으로 올라가면 루트 폴더에 도달하는 구조.
 *
 * 루트에 .env 파일이 존재한다고 가정하고 명시적 로딩.
 */
const rootEnvPath = path.resolve(__dirname, "../../..", ".env");

// 루트 .env 로딩
load({ path: rootEnvPath });

type Env = {
  NODE_ENV: string;
  SERVICE_BASE_URL: string;
  GATEWAY_PORT: number;
  ORCHESTRATOR_PORT: number;
  DATABASE_URL: string;
  LOG_LEVEL: string;
};

export const env: Env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  SERVICE_BASE_URL: process.env.SERVICE_BASE_URL ?? "http://localhost",
  GATEWAY_PORT: Number(process.env.GATEWAY_PORT ?? "3000"),
  ORCHESTRATOR_PORT: Number(process.env.ORCHESTRATOR_PORT ?? "4000"),
  DATABASE_URL:
    process.env.DATABASE_URL ??
    "postgresql://wauser:wapass@localhost:5432/wa_platform?schema=public",
  LOG_LEVEL: process.env.LOG_LEVEL ?? "info",
};
