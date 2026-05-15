import { homedir } from 'os';
import { join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';

export interface Config {
  cookie: string;
  lang: 'zh' | 'en';
  baseUrl: string;
}

const CONFIG_DIR = join(homedir(), '.bb-tui');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

const DEFAULT_CONFIG: Config = {
  cookie: '',
  lang: 'zh',
  baseUrl: 'https://bb.cuhk.edu.cn',
};

export function loadConfig(): Config {
  if (!existsSync(CONFIG_FILE)) {
    return { ...DEFAULT_CONFIG };
  }
  try {
    const raw = readFileSync(CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<Config>;
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(config: Partial<Config>): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  const current = loadConfig();
  const next: Config = { ...current, ...config };
  writeFileSync(CONFIG_FILE, JSON.stringify(next, null, 2), 'utf-8');
}
