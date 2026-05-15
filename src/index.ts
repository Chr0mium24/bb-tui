import { Command } from 'commander';
import { registerInit } from './commands/init.js';
import { registerCourses } from './commands/courses.js';
import { registerAnnouncements } from './commands/announcements.js';
import { registerAssignments } from './commands/assignments.js';
import { registerGrades } from './commands/grades.js';
import { registerMaterials } from './commands/materials.js';

const program = new Command();

program
  .name('bb-tui')
  .description('CLI for CUHK(SZ) Blackboard Learn')
  .version('0.1.0');

registerInit(program);
registerCourses(program);
registerAnnouncements(program);
registerAssignments(program);
registerGrades(program);
registerMaterials(program);

program.parse();
