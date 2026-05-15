import { Command } from 'commander';
import { apiGet } from '../core/api.js';
import { t } from '../core/i18n.js';
import { print } from '../core/output.js';
import type { Course } from '../core/types.js';
import type { OutputOptions } from '../core/output.js';

interface ApiCourse {
  id: string;
  name: string;
  courseId: string;
  availability: { available: 'Yes' | 'No' };
}

export function registerCourses(program: Command): void {
  program
    .command('courses')
    .description('List enrolled courses')
    .option('--json', 'Output as JSON')
    .action(async (opts: OutputOptions) => {
      const data = await apiGet('/learn/api/public/v1/courses?fields=id,name,courseId,availability') as { results: ApiCourse[] };
      const courses: Course[] = data.results
        .filter((c) => c.availability?.available === 'Yes')
        .map((c) => ({ id: c.id, name: c.name, courseId: c.courseId, availability: c.availability }));

      if (courses.length === 0) {
        console.log(t('courses.empty'));
        return;
      }

      const headers = [t('common.id'), t('common.name')];
      const rows = courses.map((c) => [c.id, c.name]);
      print(courses, headers, rows, opts);
    });
}
