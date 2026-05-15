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

interface ApiEnrollment {
  id: string;
  courseId: string;
  courseRoleId: string;
  availability: { available: 'Yes' | 'No' };
  course: ApiCourse;
}

export function registerCourses(program: Command): void {
  program
    .command('courses')
    .description('List enrolled courses')
    .option('--json', 'Output as JSON')
    .action(async (opts: OutputOptions) => {
      const data = await apiGet('/learn/api/public/v1/users/me/courses?expand=course') as { results: ApiEnrollment[] };
      const courses: Course[] = data.results
        .filter((e) => e.availability?.available === 'Yes')
        .map((e) => ({
          id: e.course.id,
          name: e.course.name,
          courseId: e.course.courseId,
          availability: e.availability,
        }));

      if (courses.length === 0) {
        console.log(t('courses.empty'));
        return;
      }

      const headers = [t('common.id'), t('common.name')];
      const rows = courses.map((c) => [c.id, c.name]);
      print(courses, headers, rows, opts);
    });
}
