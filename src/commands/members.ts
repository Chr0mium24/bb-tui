import { Command } from 'commander';
import { apiGet } from '../core/api.js';
import { t } from '../core/i18n.js';
import { printTable, printJSON } from '../core/output.js';
import type { OutputOptions } from '../core/output.js';

interface ApiMember {
  userId: string;
  courseRoleId: string;
  user?: {
    userName: string;
    name: {
      given?: string;
      family?: string;
    };
  };
}

export function registerMembers(program: Command): void {
  program
    .command('members <course-id>')
    .description('List course members (classmates, TAs, instructors)')
    .option('--json', 'Output as JSON')
    .option('--role <role>', 'Filter by role: Student, TeachingAssistant, Instructor')
    .action(async (courseId: string, opts: OutputOptions & { role?: string }) => {
      const data = await apiGet(`/learn/api/public/v1/courses/${courseId}/users?expand=user`) as { results: ApiMember[] };
      let members = data.results;

      if (opts.role) {
        members = members.filter((m) => m.courseRoleId === opts.role);
      }

      const rows = members.map((m) => {
        const u = m.user;
        const given = u?.name?.given ?? '';
        const family = u?.name?.family ?? '';
        const fullName = `${family} ${given}`.trim() || given || family || 'N/A';
        return {
          id: m.userId,
          role: m.courseRoleId,
          userName: u?.userName ?? '-',
          name: fullName,
        };
      });

      if (rows.length === 0) {
        console.log('No members found');
        return;
      }

      if (opts.json) {
        printJSON(rows);
        return;
      }

      const headers = ['ID', 'Role', 'Username', t('common.name')];
      const tableRows = rows.map((r) => [r.id, r.role, r.userName, r.name]);
      printTable(headers, tableRows);
    });
}
