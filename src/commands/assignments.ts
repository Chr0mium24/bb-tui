import { Command } from 'commander';
import { apiGet } from '../core/api.js';
import { t } from '../core/i18n.js';
import { printTable, printJSON } from '../core/output.js';
import type { OutputOptions } from '../core/output.js';

interface ApiGradeColumn {
  id: string;
  name: string;
  contentId?: string;
  score?: { possible?: number };
  grading?: { type?: string; due?: string; attemptsAllowed?: number; scoringModel?: string };
}

interface ApiAttempt {
  id: string;
  status: string;       // e.g. 'Completed', 'InProgress', 'NeedsGrading'
  score?: number;
  created?: string;
}

interface AssignmentRow {
  id: string;           // contentId
  columnId: string;
  title: string;
  due: string;
  possible: string;
  status: string;
  score: string;
  attempts: string;
}

function formatStatus(status?: string): string {
  switch (status) {
    case 'Completed': return t('assignments.status.completed');
    case 'InProgress': return t('assignments.status.inProgress');
    case 'NeedsGrading': return t('assignments.status.notGraded');
    default: return t('assignments.status.unsubmitted');
  }
}

export function registerAssignments(program: Command): void {
  program
    .command('assignments <course-id>')
    .description('List course assignments with submission status')
    .option('--json', 'Output as JSON')
    .option('--show-body <content-id>', 'Show assignment description')
    .action(async (courseId: string, opts: OutputOptions & { showBody?: string }) => {
      const columnsData = await apiGet(`/learn/api/public/v1/courses/${courseId}/gradebook/columns`) as { results: ApiGradeColumn[] };

      // Filter columns that are linked to an assignment content
      const assignmentColumns = columnsData.results.filter((c) => c.contentId);

      if (assignmentColumns.length === 0) {
        console.log(t('assignments.empty'));
        return;
      }

      // Fetch attempts for each assignment in parallel
      const rows: AssignmentRow[] = await Promise.all(
        assignmentColumns.map(async (col) => {
          let status = '';
          let score = '-';
          let attemptsUsed = 0;

          try {
            const attemptsData = await apiGet(`/learn/api/public/v1/courses/${courseId}/gradebook/columns/${col.id}/attempts`) as { results: ApiAttempt[] };
            attemptsUsed = attemptsData.results.length;

            if (attemptsUsed > 0) {
              const lastAttempt = attemptsData.results[attemptsUsed - 1];
              status = lastAttempt.status;
              if (lastAttempt.score !== undefined) {
                score = String(lastAttempt.score);
              }
            }
          } catch {
            // No attempts or not accessible
          }

          const due = col.grading?.due ? col.grading.due.split('T')[0] : '-';
          const possible = col.score?.possible !== undefined ? String(col.score.possible) : '-';
          const allowed = col.grading?.attemptsAllowed ?? 0;
          const attemptsStr = allowed > 0 ? `${attemptsUsed}/${allowed}` : `${attemptsUsed}/∞`;

          return {
            id: col.contentId!,
            columnId: col.id,
            title: col.name,
            due,
            possible,
            status: formatStatus(status),
            score,
            attempts: attemptsStr,
          };
        })
      );

      // --show-body: fetch assignment content body
      if (opts.showBody) {
        try {
          const content = await apiGet(`/learn/api/public/v1/courses/${courseId}/contents/${opts.showBody}?expand=body`) as { body?: string; title?: string };
          console.log(`\n${content.title ?? opts.showBody}`);
          if (content.body) {
            const plain = content.body
              .replace(/<[^\u003e]*>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            console.log(plain);
          }
        } catch {
          console.error('Could not fetch assignment body');
        }
        return;
      }

      if (opts.json) {
        printJSON(rows);
        return;
      }

      const headers = [t('common.id'), t('common.name'), t('common.due'), t('assignments.status'), t('common.score'), t('common.possible'), t('assignments.attempts')];
      const tableRows = rows.map((r) => [r.id, r.title, r.due, r.status, r.score, r.possible, r.attempts]);
      printTable(headers, tableRows);
    });
}
