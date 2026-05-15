import { Command } from 'commander';
import { apiGet } from '../core/api.js';
import { t } from '../core/i18n.js';
import { printTable, printJSON } from '../core/output.js';
import type { OutputOptions } from '../core/output.js';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  eventType: string;
  calendarName: string;
  calendarId: string;
  allDay: boolean;
  attemptable: boolean;
  location?: string;
  description?: string;
  color: string;
}

function eventTypeLabel(type: string): string {
  switch (type) {
    case 'Assignment': return '作业';
    case 'Test': return '测验';
    case 'LTI Link': return 'LTI';
    case 'Manual Grade Column': return '评分项';
    case 'blackboard.data.calendar.CalendarEntry$Type:PERSONAL': return '个人';
    default: return type;
  }
}

function formatDateTime(iso: string): { date: string; time: string } {
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
    .description('Show calendar events (assignments, tests, personal)')
    .option('--json', 'Output as JSON')
    .option('--course <course-id>', 'Filter by specific course')
    .option('--days <n>', 'Show events from N days ago to N days ahead', '120')
    .action(async (opts: OutputOptions & { course?: string; days?: string }) => {
      const daysLimit = parseInt(opts.days ?? '120', 10);
      // Wider window to include current semester events
      const start = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
      const end = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

      const startMs = start.getTime();
      const endMs = end.getTime();
      const courseId = opts.course ?? '';

      const events = await apiGet(
        `/webapps/calendar/calendarData/selectedCalendarEvents?start=${startMs}&end=${endMs}&course_id=${courseId}&mode=personal`
      ) as CalendarEvent[];

      if (events.length === 0) {
        console.log('No upcoming events');
        return;
      }

      // Sort by start time
      events.sort((a, b) => a.start.localeCompare(b.start));

      if (opts.json) {
        printJSON(events.map((e) => ({
          id: e.id,
          title: e.title,
          date: formatDateTime(e.start).date,
          time: formatDateTime(e.start).time,
          endTime: formatDateTime(e.end).time,
          type: eventTypeLabel(e.eventType),
          course: e.calendarName,
          allDay: e.allDay,
          attemptable: e.attemptable,
          location: e.location,
        })));
        return;
      }

      const headers = [t('common.date'), 'Time', 'Type', t('common.name'), 'Course'];
      const rows = events.map((e) => {
        const { date, time } = formatDateTime(e.start);
        const courseName = e.calendarId === 'PERSONAL' ? 'Personal' : e.calendarName;
        return [date, e.allDay ? '全天' : time, eventTypeLabel(e.eventType), e.title, courseName];
      });
      printTable(headers, rows);
    });
}
