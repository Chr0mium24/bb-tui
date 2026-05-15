import { Command } from 'commander';
import { saveConfig } from '../core/config.js';
import { t } from '../core/i18n.js';

export function registerInit(program: Command): void {
  program
    .command('init')
    .description('Initialize with cookie')
    .option('--cookie <string>', 'Blackboard session cookie')
    .option('--lang <zh|en>', 'Output language', 'zh')
    .action((options: { cookie?: string; lang?: string }) => {
      if (!options.cookie) {
        console.error(t('init.missing_cookie'));
        process.exit(1);
      }
      const lang = options.lang === 'en' ? 'en' : 'zh';
      saveConfig({ cookie: options.cookie, lang });
      console.log(t('init.saved'));
    });
}
