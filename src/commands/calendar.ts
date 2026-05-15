import { Command } from 'commander';
import { apiGet } from '../core/api.js';
import { t } from '../core/i18n.js';
import { printTable, printJSON } from '../core/output.js';
import type { OutputOptions } from '../core/output.js';

interface ApiCourse {
  id: string;
  name: string;
}

interface ApiEnrollment {
  course: ApiCourse;
  availability: { available: 'Yes' | 'No' };
}

interface ApiGradeColumn {
  id: string;
  name: string;
  contentId?: string;
  score?: { possible?: number };
  grading?: { type?: string; due?: string; attemptsAllowed?: number };
}

interface ApiAnnouncement {
  id: string;
  title: string;
  created: string;
}

interface CalendarEvent {
  date: string;       // YYYY-MM-DD
  time: string;       // HH:MM or ''
  type: string;       // 'Assignment' | 'Announcement'
  course: string;
  title: string;
  id: string;
  detail?: string;
}

function parseDate(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${min}` };
}

export function registerCalendar(program: Command): void {
  program
    .command('calendar')
    .description('Show upcoming deadlines and announcements across all courses')
    .option('--json', 'Output as JSON')
    .option('--course <course-id>', 'Filter by specific course')
    .option('--days <n>', 'Show events within next N days', '30')
    .action(async (opts: OutputOptions & { course?: string; days?: string }) => {
      const daysLimit = parseInt(opts.days ?? '30', 10);
      const now = new Date();
      const cutoff = new Date(now.getTime() + daysLimit * 24 * 60 * 60 * 1000);

      // Fetch courses
      let courseIds: { id: string; name: string }[] = [];
      if (opts.course) {
        // Get course name
        try {
          const c = await apiGet(`/learn/api/public/v1/courses/${opts.course}`) as ApiCourse;
          courseIds = [{ id: opts.course, name: c.name }];
        } catch {
          console.error('Course not found');
          process.exit(1);
        }
      } else {
        const enrollments = await apiGet('/learn/api/public/v1/users/me/courses?expand=course') as { results: ApiEnrollment[] };
        courseIds = enrollments.results
          .filter((e) => e.availability?.available === 'Yes')
          .map((e) => ({ id: e.course.id, name: e.course.name }));
      }

      // Gather events in parallel per course
      const allEvents: CalendarEvent[] = [];
      await Promise.all(
        courseIds.map(async ({ id, name }) => {
          // Gradebook columns (assignments with due dates)
          try {
            const grades = await apiGet(`/learn/api/public/v1/courses/${id}/gradebook/columns`) as { results: ApiGradeColumn[] };
            for (const col of grades.results) {
              if (col.grading?.due) {
                const due = new Date(col.grading.due);
                if (due >= now && due <= cutoff) {
                  const { date, time } = parseDate(col.grading.due);
                  allEvents.push({
                    date,
                    time,
                    type: t('assignments.title'),
                    course: name,
                    title: col.name,
                    id: col.contentId ?? col.id,
                    detail: col.score?.possible ? `${t('common.possible')}: ${col.score.possible}` : undefined,
                  });
                }
              }
            }
          } catch {
            // skip
          }

          // Announcements (recent)
          try {
            const anns = await apiGet(`/learn/api/public/v1/courses/${id}/announcements`) as { results: ApiAnnouncement[] };
            for (const a of anns.results) {
              const created = new Date(a.created);
              if (created >= new Date(now.getTime() - daysLimit * 24 * 60 * 60 * 1000) && created <= cutoff) {
                const { date, time } = parseDate(a.created);
                allEvents.push({
                  date,
                  time,
                  type: t('announcements.title'),
                  course: name,
                  title: a.title,
                  id: a.id,
                });
              }
            }
          } catch {
            // skip
          }
        })
      );

      // Sort by date ascending
      allEvents.sort((a, b) => {
        const d = a.date.localeCompare(b.date);
        if (d !== 0) return d;
        return a.time.localeCompare(b.time);
      });

      if (allEvents.length === 0) {
        console.log('No upcoming events');
        return;
      }

      if (opts.json) {
        printJSON(allEvents);
        return;
      }

      const headers = [t('common.date'), 'Time', 'Type', t('common.name'), 'Course', 'ID'];
      const rows = allEvents.map((e) => [
        e.date,
        e.time,
        e.type,
        e.title,
        e.course,
        e.id,
      ]);
      printTable(headers, rows);
    });
}
