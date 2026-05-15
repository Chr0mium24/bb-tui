import { Command } from 'commander';
import { loadConfig } from '../core/config.js';
import { t } from '../core/i18n.js';
import { print } from '../core/output.js';
import type { OutputOptions } from '../core/output.js';

const BASE = 'https://bb.cuhk.edu.cn';

interface MenuItem {
  id: string;
  title: string;
  href: string;
  type: 'link' | 'divider';
}

function isExpired(res: Response): boolean {
  if (res.status === 401) return true;
  const loc = res.headers.get('location') ?? '';
  if (loc.includes('/login') || loc.includes('/webapps/login')) return true;
  return false;
}

async function fetchMenu(courseId: string): Promise<MenuItem[]> {
  const { cookie } = loadConfig();
  const url = `${BASE}/webapps/blackboard/content/courseMenu.jsp?course_id=${courseId}&newWindow=true`;
  const res = await fetch(url, {
    headers: { Cookie: cookie, Accept: 'text/html' },
    redirect: 'manual',
  });

  if (isExpired(res)) {
    console.error(t('session.expired'));
    process.exit(1);
  }

  if (!res.ok) {
    throw new Error(`${t('api.error')}: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const items: MenuItem[] = [];

  // Match: <li id="paletteItem:_xxx_1" ...><a href="..."><span title="Title">Title</span></a></li>
  const re = /<li\s+id="paletteItem:([^"]+)"[^\u003e]*class="([^"]*)"[^\u003e]*>\s*<a\s+href="([^"]*)"[^\u003e]*>\s*<span\s+title="([^"]*)"[^\u003e]*>([^\u003c]*)<\/span><\/a><\/li>/g;

  let m;
  while ((m = re.exec(html)) !== null) {
    const id = m[1];
    const cls = m[2];
    const href = m[3];
    const title = m[4];
    const isDivider = cls.includes('divider');
    items.push({
      id,
      title: title.trim(),
      href,
      type: isDivider ? 'divider' : 'link',
    });
  }

  return items;
}

export function registerMenu(program: Command): void {
  program
    .command('menu <course-id>')
    .description('Show course menu (Home, Announcements, Content, etc.)')
    .option('--json', 'Output as JSON')
    .action(async (courseId: string, opts: OutputOptions) => {
      const items = await fetchMenu(courseId);

      if (items.length === 0) {
        console.log('No menu items found');
        return;
      }

      const headers = [t('common.id'), t('common.name'), 'URL'];
      const rows = items.map((i) => [i.id, i.title, i.href]);
      print(items, headers, rows, opts);
    });
}
