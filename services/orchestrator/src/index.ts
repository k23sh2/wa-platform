// services/orchestrator/src/index.ts

import Fastify, { type FastifyRequest } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod';

import * as envModule from '../../../packages/config/src/index';
import * as dbModule from '../../../packages/db/src/index';
import * as types from '../../../packages/types/src/index';
import type { MessageCreate } from '../../../packages/types/src/index';
import { logger as baseLogger } from '../../../packages/logger/src';

const env =
  (envModule as any).env ??
  (envModule as any).default.env ??
  envModule;

const prisma = (dbModule as any).prisma ?? (dbModule as any).default;
const MessageCreateSchema =
  (types as any).MessageCreateSchema ?? (types as any).default?.MessageCreateSchema;

const logger = baseLogger.child({ service: 'orchestrator' });

const app = Fastify({
  logger,
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);
app.withTypeProvider<ZodTypeProvider>();

// 헬스 체크
app.get('/health', async () => ({ ok: true }));

// 메시지 생성
app.post(
  '/messages',
  {
    schema: {
      body: MessageCreateSchema,
    },
  },
  async (req: FastifyRequest<{ Body: MessageCreate }>, reply) => {
    const { userId, text } = req.body;
    const message = await prisma.message.create({
      data: { userId, text },
    });
    return reply.code(201).send(message);
  },
);

// userId 기준 메시지 목록 조회
app.get('/messages/:userId', async (req, reply) => {
  const { userId } = req.params as { userId: string };
  const list = await prisma.message.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return reply.send(list);
});

async function start() {
  try {
    await app.listen({ host: '0.0.0.0', port: env.ORCHESTRATOR_PORT });
    app.log.info(
      `orchestrator running at ${env.SERVICE_BASE_URL}:${env.ORCHESTRATOR_PORT}`,
    );
  } catch (err) {
    app.log.error({ err }, 'failed to start orchestrator');
    process.exit(1);
  }
}

start();
