
import { PrismaClient } from '@prisma/client';
import { env } from '@wa/config';

export const prisma = new PrismaClient({
  datasources: { db: { url: env.DATABASE_URL } },
});
