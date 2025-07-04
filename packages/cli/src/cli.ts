import { Command } from 'commander';
import { CodeCheckEngine } from '@code-check/core-engine';
import { formatOutput } from '@code-check/shared';

export function createCLI(): Command {
  const program = new Command();

  program
    .name('code-check')
    .description('Code analysis CLI tool')
    .version('0.0.0');

  program
    .command('analyze')
    .description('Analyze code files')
    .argument('<file>', 'File to analyze')
    .action((file: string) => {
      const engine = new CodeCheckEngine();
      const result = engine.analyze(file);
      console.log(formatOutput(result));
    });

  return program;
}
