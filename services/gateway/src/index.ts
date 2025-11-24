
import Fastify from 'fastify';
import { env } from '@wa/config';
import { logger } from '@wa/logger';
import proxy from '@fastify/http-proxy';
import { MessageCreateSchema } from '@wa/types';
import { httpPost } from '@wa/http';

const app = Fastify({ logger });

// 헬스체크
app.get('/health', async () => ({ ok: true }));

// 메시지 생성 (BFF 스타일로 검증 후 오케스트레이터에 위임)
app.post('/api/v1/messages', async (req, reply) => {
  const body = await req.body;
  const parsed = MessageCreateSchema.safeParse(body);
  if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

  const url = `${env.SERVICE_BASE_URL}:${env.ORCHESTRATOR_PORT}/messages`;
  const created = await httpPost(url, parsed.data);
  return reply.code(201).send(created);
});

// 조회는 프록시로 패스스루
await app.register(proxy, {
  upstream: `${env.SERVICE_BASE_URL}:${env.ORCHESTRATOR_PORT}`,
  prefix: '/api/v1', // /api/v1/messages/:userId -> orchestrator /messages/:userId
  rewritePrefix: ''
});

app.listen({ host: '0.0.0.0', port: env.GATEWAY_PORT }).then(() => {
  logger.info(`gateway running at ${env.SERVICE_BASE_URL}:${env.GATEWAY_PORT}`);
});
