
import Fastify from 'fastify';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';
import { env } from '@wa/config';
import { logger } from '@wa/logger';
import { prisma } from '@wa/db';
import { MessageCreateSchema } from '@wa/types';

const app = Fastify({ logger });

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.withTypeProvider<ZodTypeProvider>();

app.get('/health', async () => ({ ok: true }));

app.post('/messages', {
  schema: {
    body: MessageCreateSchema
  }
}, async (req, reply) => {
  const { userId, text } = req.body;
  const message = await prisma.message.create({ data: { userId, text } });
  return reply.code(201).send(message);
});

app.get('/messages/:userId', async (req, reply) => {
  const userId = (req.params as any).userId as string;
  const list = await prisma.message.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  return reply.send(list);
});

app.listen({ host: '0.0.0.0', port: env.ORCHESTRATOR_PORT }).then(() => {
  logger.info(`orchestrator running at ${env.SERVICE_BASE_URL}:${env.ORCHESTRATOR_PORT}`);
});
