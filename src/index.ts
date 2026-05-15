import { Command } from 'commander';
import { registerInit } from './commands/init.js';
import { registerCourses } from './commands/courses.js';
import { registerAnnouncements } from './commands/announcements.js';

const program = new Command();

program
  .name('bb-tui')
  .description('CLI for CUHK(SZ) Blackboard Learn')
  .version('0.1.0');

registerInit(program);
registerCourses(program);
registerAnnouncements(program);

program.parse();
