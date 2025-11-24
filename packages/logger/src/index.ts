
import pino from 'pino';
import { env } from '@wa/config';

export const logger = pino({
  level: env.LOG_LEVEL,
  base: undefined,
  redact: ['req.headers.authorization', 'password']
});
