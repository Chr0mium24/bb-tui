import { Command } from 'commander';
import { apiGet } from '../core/api.js';
import { t } from '../core/i18n.js';
import { print } from '../core/output.js';
import type { Announcement } from '../core/types.js';
import type { OutputOptions } from '../core/output.js';

interface ApiAnnouncement {
  id: string;
  title: string;
  body?: string;
  created: string;
}

export function registerAnnouncements(program: Command): void {
  program
    .command('announcements <course-id>')
    .description('List course announcements')
    .option('--json', 'Output as JSON')
    .option('--show-body', 'Show full body text')
    .action(async (courseId: string, opts: OutputOptions & { showBody?: boolean }) => {
      const data = await apiGet(`/learn/api/public/v1/courses/${courseId}/announcements`) as { results: ApiAnnouncement[] };
      const announcements: Announcement[] = data.results.map((a) => ({
        id: a.id,
        title: a.title,
        body: a.body,
        created: a.created,
      }));

      if (announcements.length === 0) {
        console.log(t('announcements.empty'));
        return;
      }

      if (opts.showBody && !opts.json) {
        for (const a of announcements) {
          console.log(`\n[${a.created}] ${a.title}`);
          if (a.body) {
            const plain = a.body.replace(/<[^\u003e]*>/g, '').replace(/\s+/g, ' ').trim();
            console.log(plain.slice(0, 500) + (plain.length > 500 ? '...' : ''));
          }
        }
        return;
      }

      const headers = [t('common.id'), t('common.date'), t('common.name')];
      const rows = announcements.map((a) => [a.id, a.created.split('T')[0], a.title]);
      print(announcements, headers, rows, opts);
    });
}
