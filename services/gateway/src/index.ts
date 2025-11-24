import Fastify from 'fastify';
import proxy from '@fastify/http-proxy';

// 전부 src 기준 namespace import
import * as envModule from '../../../packages/config/src/index';
import * as types from '../../../packages/types/src/index';
import * as http from '../../../packages/http/src/index';

const env =
  (envModule as any).env ??
  (envModule as any).default.env ??
  envModule;

const { MessageCreateSchema } = types;
const { httpPost } = http;

const app = Fastify({
  logger: true, // ✅ Fastify 기본 로거 사용
});
const logger = app.log;

// 헬스체크
app.get('/health', async () => ({ ok: true }));

// 메시지 생성
app.post('/api/v1/messages', async (req, reply) => {
  const body = req.body;
  const parsed = MessageCreateSchema.safeParse(body);
  if (!parsed.success) {
    return reply.code(400).send({ error: parsed.error.flatten() });
  }

  const url = `${env.SERVICE_BASE_URL}:${env.ORCHESTRATOR_PORT}/messages`;
  const created = await httpPost(url, parsed.data);
  return reply.code(201).send(created);
});

async function start() {
  await app.register(proxy, {
    upstream: `${env.SERVICE_BASE_URL}:${env.ORCHESTRATOR_PORT}`,
    prefix: '/api/v1',
    rewritePrefix: '',
  });

  await app.listen({ host: '0.0.0.0', port: env.GATEWAY_PORT });
  logger.info(`gateway running at ${env.SERVICE_BASE_URL}:${env.GATEWAY_PORT}`);
}

start();