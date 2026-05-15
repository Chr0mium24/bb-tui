import { Command } from 'commander';
import { apiGet } from '../core/api.js';
import { t } from '../core/i18n.js';
import { print } from '../core/output.js';
import type { OutputOptions } from '../core/output.js';

interface ApiContent {
  id: string;
  parentId?: string;
  title: string;
  contentHandler: { id: string };
  links?: { href: string; rel: string }[];
}

interface ApiGradeColumn {
  id: string;
  name: string;
  contentId?: string;
  grading?: { type?: string; due?: string; attemptsAllowed?: number };
}

export function registerAssignments(program: Command): void {
  program
    .command('assignments <course-id>')
    .description('List course assignments')
    .option('--json', 'Output as JSON')
    .action(async (courseId: string, opts: OutputOptions) => {
      const [contentsRes, gradesRes] = await Promise.all([
        apiGet(`/learn/api/public/v1/courses/${courseId}/contents?recursive=true`) as Promise<{ results: ApiContent[] }>,
        apiGet(`/learn/api/public/v1/courses/${courseId}/gradebook/columns`) as Promise<{ results: ApiGradeColumn[] }>,
      ]);

      const assignments = contentsRes.results.filter(
        (c) => c.contentHandler?.id === 'resource/x-bb-assignment'
      );

      const gradeMap = new Map<string, ApiGradeColumn>();
      for (const g of gradesRes.results) {
        if (g.contentId) gradeMap.set(g.contentId, g);
      }

      const rows = assignments.map((a) => {
        const g = gradeMap.get(a.id);
        const due = g?.grading?.due ? g.grading.due.split('T')[0] : '-';
        const attempts = g?.grading?.attemptsAllowed ?? '-';
        return { id: a.id, title: a.title, due, attempts };
      });

      if (rows.length === 0) {
        console.log(t('assignments.empty'));
        return;
      }

      const headers = [t('common.id'), t('common.name'), t('common.due'), t('common.type')];
      const tableRows = rows.map((r) => [r.id, r.title, r.due, String(r.attempts)]);
      print(rows, headers, tableRows, opts);
    });
}
