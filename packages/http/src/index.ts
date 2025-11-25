import { createLogger } from '@wa/logger';
import { request } from 'undici';

const logger = createLogger({ service: 'httpPost' });
export async function httpPost<T>(url: string, body: unknown): Promise<T> {
  const res = await request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  const json = await res.body.json();
  logger.debug({ url, status: res.statusCode });
  return json as T;
}
