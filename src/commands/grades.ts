import { Command } from 'commander';
import { apiGet } from '../core/api.js';
import { t } from '../core/i18n.js';
import { print } from '../core/output.js';
import type { OutputOptions } from '../core/output.js';

interface ApiGradeColumn {
  id: string;
  name: string;
  score?: { possible?: number };
  grading?: { type?: string; due?: string };
}

interface ApiGradeAttempt {
  id: string;
  columnId: string;
  score?: number;
  status?: string;
}

export function registerGrades(program: Command): void {
  program
    .command('grades <course-id>')
    .description('View gradebook')
    .option('--json', 'Output as JSON')
    .action(async (courseId: string, opts: OutputOptions) => {
      const [columnsRes] = await Promise.all([
        apiGet(`/learn/api/public/v1/courses/${courseId}/gradebook/columns`) as Promise<{ results: ApiGradeColumn[] }>,
      ]);

      const columns = columnsRes.results;
      if (columns.length === 0) {
        console.log(t('grades.empty'));
        return;
      }

      const rows = [];
      for (const col of columns) {
        let score = '-';
        try {
          const attempts = await apiGet(`/learn/api/public/v1/courses/${courseId}/gradebook/columns/${col.id}/attempts?fields=score,status`) as { results: ApiGradeAttempt[] };
          if (attempts.results.length > 0) {
            const best = attempts.results
              .filter((a) => a.score !== undefined)
              .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
            if (best) score = String(best.score);
          }
        } catch {
          score = '-';
        }

        rows.push({
          id: col.id,
          name: col.name,
          possible: col.score?.possible ?? '-',
          score,
        });
      }

      const headers = [t('common.id'), t('common.name'), t('common.possible'), t('common.score')];
      const tableRows = rows.map((r) => [r.id, r.name, String(r.possible), String(r.score)]);
      print(rows, headers, tableRows, opts);
    });
}
