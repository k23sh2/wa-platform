import pino from 'pino';
import { env } from '../../config/src';

export const logger = pino({
  level: env.LOG_LEVEL,
  base: undefined,
  redact: ['req.headers.authorization', 'password'],
});
