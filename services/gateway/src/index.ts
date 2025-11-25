import Fastify from 'fastify';
import proxy from '@fastify/http-proxy';

import { createLogger } from '@wa/logger';

// 전부 src 기준 namespace import
import { env } from '@wa/config';
import * as types from '../../../packages/types/src/index';
import * as http from '../../../packages/http/src/index';

const { MessageCreateSchema } = types;
const { httpPost } = http;

// 🔹 공통 로거 생성 (pino 기반)
const logger = createLogger({ service: 'gateway' });

const app = Fastify({
  loggerInstance: logger,
});

// 헬스체크
app.get('/health', async (req, reply) => {
  req.log.info('health check called');
  return { ok: true };
});

// 메시지 생성
app.post('/api/v1/messages', async (req, reply) => {
  const body = req.body;

  // 스키마: { userId: string; text: string }
  const parsed = MessageCreateSchema.safeParse(body);

  if (!parsed.success) {
    req.log.warn(
      { error: parsed.error.flatten() },
      'invalid message create payload',
    );
    return reply.code(400).send({ error: parsed.error.flatten() });
  }

  const data = parsed.data; // { userId, text }
  const url = `${env.SERVICE_BASE_URL}:${env.ORCHESTRATOR_PORT}/messages`;

  try {
    // httpPost 타입이 좁게 잡혀 있어서 any 캐스팅
    const created: any = await httpPost(url, data);

    req.log.info(
      { userId: data.userId },
      'message created via orchestrator',
    );

    // created 안에 뭐가 오든 그냥 그대로 반환
    return reply.code(201).send(created);
  } catch (err: any) {
    req.log.error(
      { err, url },
      'failed to create message via orchestrator',
    );
    return reply.code(502).send({ error: 'orchestrator_error' });
  }
});

// 🔹 공통 에러 핸들러 (옵션)
app.setErrorHandler((error, req, reply) => {
  req.log.error({ err: error }, 'unhandled error');
  reply.code(500).send({ error: 'internal_server_error' });
});

async function start() {
  await app.register(proxy, {
    upstream: `${env.SERVICE_BASE_URL}:${env.ORCHESTRATOR_PORT}`,
    prefix: '/api/v1',
    rewritePrefix: '',
  });

  await app.listen({ host: '0.0.0.0', port: env.GATEWAY_PORT });

  app.log.info(
    `gateway running at ${env.SERVICE_BASE_URL}:${env.GATEWAY_PORT}`,
  );
}

start().catch((err) => {
  logger.error({ err }, 'failed to start gateway');
  process.exit(1);
});
