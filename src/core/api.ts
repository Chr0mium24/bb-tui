import { loadConfig } from './config.js';
import { t } from './i18n.js';

const BASE = 'https://bb.cuhk.edu.cn';

function getHeaders(): Record<string, string> {
  const { cookie } = loadConfig();
  return {
    'Cookie': cookie,
    'Accept': 'application/json',
  };
}

function isExpired(res: Response): boolean {
  if (res.status === 401) return true;
  if (res.status === 302 || res.redirected) {
    const loc = res.headers.get('location') ?? '';
    if (loc.includes('/login') || loc.includes('/webapps/login')) return true;
  }
  return false;
}

export async function apiGet(path: string): Promise<unknown> {
  const url = `${BASE}${path}`;
  const res = await fetch(url, { headers: getHeaders(), redirect: 'manual' });

  if (isExpired(res)) {
    console.error(t('session.expired'));
    process.exit(1);
  }

  if (!res.ok) {
    throw new Error(`${t('api.error')}: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function downloadFile(urlPath: string, outPath: string): Promise<void> {
  const { createWriteStream } = await import('fs');
  const { pipeline } = await import('stream/promises');

  const url = `${BASE}${urlPath}`;
  const res = await fetch(url, {
    headers: getHeaders(),
    redirect: 'follow',
  });

  if (isExpired(res)) {
    console.error(t('session.expired'));
    process.exit(1);
  }

  if (!res.ok || !res.body) {
    throw new Error(`${t('api.error')}: ${res.status} ${res.statusText}`);
  }

  const stream = createWriteStream(outPath);
  await pipeline(res.body as unknown as NodeJS.ReadableStream, stream);
}
