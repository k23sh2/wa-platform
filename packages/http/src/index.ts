import { logger } from '../../logger/src';
import { request } from 'undici';

export async function httpPost<T>(url: string, body: unknown): Promise<T> {
  const res = await request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  const json = await res.body.json();
  logger.debug({ url, status: res.statusCode }, 'httpPost');
  return json as T;
}
