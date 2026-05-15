import { Command } from 'commander';
import { apiGet } from '../core/api.js';
import { t } from '../core/i18n.js';
import { printTable, printJSON } from '../core/output.js';
import type { Course } from '../core/types.js';
import type { OutputOptions } from '../core/output.js';

interface ApiCourse {
  id: string;
  name: string;
  courseId: string;
  termId: string;
  availability: { available: 'Yes' | 'No' };
}

interface ApiEnrollment {
  id: string;
  courseId: string;
  courseRoleId: string;
  availability: { available: 'Yes' | 'No' };
  course: ApiCourse;
}

interface ApiTerm {
  id: string;
  name: string;
}

export function registerCourses(program: Command): void {
  program
    .command('courses')
    .description('List enrolled courses')
    .option('--json', 'Output as JSON')
    .action(async (opts: OutputOptions) => {
      // Load all terms to build termId -> name map
      const [enrollmentsData, termsData] = await Promise.all([
        apiGet('/learn/api/public/v1/users/me/courses?expand=course') as Promise<{ results: ApiEnrollment[] }>,
        apiGet('/learn/api/public/v1/terms') as Promise<{ results: ApiTerm[] }>,
      ]);

      const termMap = new Map<string, string>();
      for (const term of termsData.results) {
        termMap.set(term.id, term.name);
      }

      let courses: Course[] = enrollmentsData.results
        .filter((e) => e.availability?.available === 'Yes')
        .map((e) => ({
          id: e.course.id,
          name: e.course.name,
          courseId: e.course.courseId,
          termId: e.course.termId,
          termName: termMap.get(e.course.termId) ?? e.course.termId,
          availability: e.availability,
        }));

      if (courses.length === 0) {
        console.log(t('courses.empty'));
        return;
      }

      // Sort by termName descending (e.g. 2520UG before 2510UG), then by course name
      courses.sort((a, b) => {
        const termDiff = (b.termName ?? '').localeCompare(a.termName ?? '');
        if (termDiff !== 0) return termDiff;
        return a.name.localeCompare(b.name);
      });

      if (opts.json) {
        printJSON(courses);
        return;
      }

      // Group by term for table output
      const groups = new Map<string, Course[]>();
      for (const c of courses) {
        const key = c.termName ?? 'Unknown';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(c);
      }

      for (const [term, list] of groups) {
        console.log(`\n=== ${term} ===`);
        const headers = [t('common.id'), t('common.name')];
        const rows = list.map((c) => [c.id, c.name]);
        printTable(headers, rows);
      }
    });
}
