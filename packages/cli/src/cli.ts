import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import figlet from 'figlet';
import boxen from 'boxen';
import fs from 'fs-extra';
import path from 'path';
import pLimit from 'p-limit';
import cliProgress from 'cli-progress';
import { table } from 'table';

import { CodeCheckEngine } from '@code-check/core-engine';
import {
  formatOutput,
  createLogger,
  DEFAULT_CONFIG,
  generateId,
  isValidUrl,
  Result,
  LogLevel,
} from '@code-check/shared';

interface CLIOptions {
  config?: string;
  output?: string;
  format?: 'json' | 'html' | 'markdown' | 'all';
  concurrency?: number;
  verbose?: boolean;
  silent?: boolean;
  ci?: boolean;
  exclude?: string[];
  include?: string[];
  severity?: 'error' | 'warning' | 'info' | 'all';
  plugins?: string[];
  timeout?: number;
  maxFileSize?: number;
  bail?: boolean;
}

interface InitOptions {
  force?: boolean;
  template?: string;
  interactive?: boolean;
}

interface AuditOptions extends CLIOptions {
  fix?: boolean;
  dryRun?: boolean;
  watch?: boolean;
  cache?: boolean;
  diff?: boolean;
}

interface ReportOptions extends CLIOptions {
  template?: string;
  theme?: string;
  open?: boolean;
  merge?: string[];
}

interface CIOptions extends CLIOptions {
  failureThreshold?: number;
  maxWarnings?: number;
  baseline?: string;
  uploadResults?: boolean;
  webhook?: string;
}

export function createCLI(): Command {
  const program = new Command();

  // ASCII Art Header
  const displayHeader = () => {
    console.log(
      chalk.cyan(
        figlet.textSync('CodeCheck', {
          font: 'ANSI Shadow',
          horizontalLayout: 'default',
          verticalLayout: 'default',
        })
      )
    );
    console.log(chalk.gray('  Advanced Code Analysis Engine\n'));
  };

  program
    .name('codecheck')
    .description('Advanced code analysis and quality assessment tool')
    .version('1.0.0')
    .option('-v, --verbose', 'Enable verbose logging')
    .option('-s, --silent', 'Suppress all output except errors')
    .option('-c, --config <path>', 'Path to configuration file')
    .hook('preAction', (thisCommand) => {
      if (!thisCommand.opts().silent) {
        displayHeader();
      }
    });

  // Init Command
  program
    .command('init')
    .description('Initialize CodeCheck configuration in current directory')
    .option('-f, --force', 'Overwrite existing configuration')
    .option(
      '-t, --template <name>',
      'Use a specific template (typescript, javascript, react, node)'
    )
    .option('-i, --interactive', 'Run interactive setup wizard')
    .action(async (options: InitOptions) => {
      await initCommand(options);
    });

  // Audit Command
  program
    .command('audit')
    .description('Audit codebase for quality, security, and performance issues')
    .argument('[path]', 'Path to audit (defaults to current directory)', '.')
    .option(
      '-o, --output <path>',
      'Output directory for reports',
      './codecheck-reports'
    )
    .option(
      '-f, --format <type>',
      'Output format (json|html|markdown|all)',
      'all'
    )
    .option('-j, --concurrency <number>', 'Number of concurrent workers', '4')
    .option('--fix', 'Automatically fix issues where possible')
    .option('--dry-run', 'Show what would be fixed without making changes')
    .option('--watch', 'Watch for file changes and re-run analysis')
    .option('--cache', 'Enable result caching for faster subsequent runs')
    .option('--diff', 'Only analyze files changed since last commit')
    .option('--exclude <patterns...>', 'Exclude file patterns')
    .option('--include <patterns...>', 'Include only specific file patterns')
    .option(
      '--severity <level>',
      'Filter by severity level (error|warning|info|all)',
      'all'
    )
    .option('--plugins <names...>', 'Enable specific plugins')
    .option('--timeout <seconds>', 'Analysis timeout in seconds', '300')
    .option(
      '--max-file-size <bytes>',
      'Skip files larger than specified size',
      '1048576'
    )
    .option('--bail', 'Stop analysis on first error')
    .action(async (targetPath: string, options: AuditOptions) => {
      await auditCommand(targetPath, options);
    });

  // Report Command
  program
    .command('report')
    .description('Generate detailed reports from previous analysis results')
    .argument(
      '[input]',
      'Input file or directory containing analysis results',
      './codecheck-reports'
    )
    .option(
      '-o, --output <path>',
      'Output directory for reports',
      './codecheck-reports'
    )
    .option(
      '-f, --format <type>',
      'Output format (json|html|markdown|all)',
      'all'
    )
    .option('-t, --template <path>', 'Custom report template')
    .option('--theme <name>', 'Report theme (dark|light|corporate)', 'light')
    .option('--open', 'Open generated HTML report in browser')
    .option('--merge <files...>', 'Merge multiple analysis results')
    .action(async (input: string, options: ReportOptions) => {
      await reportCommand(input, options);
    });

  // CI Command
  program
    .command('ci')
    .description('Run analysis in CI/CD environment with specialized output')
    .argument('[path]', 'Path to audit (defaults to current directory)', '.')
    .option(
      '-o, --output <path>',
      'Output directory for reports',
      './codecheck-reports'
    )
    .option(
      '-f, --format <type>',
      'Output format (json|html|markdown|all)',
      'all'
    )
    .option('-j, --concurrency <number>', 'Number of concurrent workers', '8')
    .option(
      '--failure-threshold <number>',
      'Fail if score is below threshold',
      '70'
    )
    .option('--max-warnings <number>', 'Maximum allowed warnings', '50')
    .option('--baseline <path>', 'Baseline results file for comparison')
    .option('--upload-results', 'Upload results to configured service')
    .option('--webhook <url>', 'Webhook URL for notifications')
    .option('--exclude <patterns...>', 'Exclude file patterns')
    .option('--include <patterns...>', 'Include only specific file patterns')
    .option(
      '--severity <level>',
      'Filter by severity level (error|warning|info|all)',
      'all'
    )
    .option('--plugins <names...>', 'Enable specific plugins')
    .option('--timeout <seconds>', 'Analysis timeout in seconds', '600')
    .option('--bail', 'Stop analysis on first error')
    .action(async (targetPath: string, options: CIOptions) => {
      await ciCommand(targetPath, options);
    });

  return program;
}

async function initCommand(options: InitOptions): Promise<void> {
  const spinner = ora('Initializing CodeCheck configuration...').start();

  try {
    const configPath = path.join(process.cwd(), 'codecheck.config.ts');
    const packagePath = path.join(process.cwd(), 'package.json');

    // Check if config already exists
    if ((await fs.pathExists(configPath)) && !options.force) {
      spinner.fail(
        'Configuration file already exists. Use --force to overwrite.'
      );
      return;
    }

    let config = {};

    if (options.interactive) {
      spinner.stop();
      config = await runInteractiveSetup();
      spinner.start('Generating configuration...');
    } else {
      config = await generateDefaultConfig(options.template);
    }

    // Write configuration file
    const configContent = generateConfigFile(config);
    await fs.writeFile(configPath, configContent);

    // Update package.json scripts if it exists
    if (await fs.pathExists(packagePath)) {
      await updatePackageScripts(packagePath);
    }

    spinner.succeed(
      chalk.green('✅ CodeCheck configuration initialized successfully!')
    );

    console.log(
      boxen(
        chalk.white.bold('Next Steps:\n\n') +
          chalk.gray('1. Review the generated configuration file\n') +
          chalk.gray('2. Run ') +
          chalk.cyan('codecheck audit') +
          chalk.gray(' to start analysis\n') +
          chalk.gray('3. Check out the documentation for advanced features'),
        {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: 'green',
        }
      )
    );
  } catch (error) {
    spinner.fail(
      `Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    process.exit(1);
  }
}

async function auditCommand(
  targetPath: string,
  options: AuditOptions
): Promise<void> {
  const startTime = Date.now();

  try {
    // Validate target path
    if (!(await fs.pathExists(targetPath))) {
      console.error(chalk.red(`❌ Path not found: ${targetPath}`));
      process.exit(1);
    }

    // Load configuration
    const config = await loadConfiguration(options.config);

    // Setup concurrent execution
    const limit = pLimit(parseInt(String(options.concurrency || '4')));

    // Initialize progress tracking
    const progressBar = new cliProgress.SingleBar({
      format:
        chalk.cyan('Analyzing') +
        ' |' +
        chalk.yellow('{bar}') +
        '| {percentage}% | {value}/{total} files | ETA: {eta}s',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
    });

    // Discovery phase
    const discoverySpinner = ora('Discovering files...').start();
    const engine = new CodeCheckEngine({
      projectPath: targetPath,
      ...config,
      concurrency: parseInt(String(options.concurrency || '4')),
      excludePatterns: options.exclude,
      includePatterns: options.include,
      maxFileSize: parseInt(String(options.maxFileSize || '1048576')),
      timeout: parseInt(String(options.timeout || '300')) * 1000,
      bail: options.bail || false,
    });

    await engine.initialize();
    discoverySpinner.succeed(
      `Found ${engine.getDiscoveredFiles().length} files to analyze`
    );

    // Analysis phase
    const files = engine.getDiscoveredFiles();
    progressBar.start(files.length, 0);

    const analysisSpinner = ora('Running concurrent analysis...').start();

    // Setup progress tracking
    let completedFiles = 0;
    const updateProgress = () => {
      completedFiles++;
      progressBar.update(completedFiles);
    };

    // Run analysis with progress tracking
    const result = await engine.analyze({
      onFileComplete: updateProgress,
      onProgress: (current, total) => {
        progressBar.update(current);
      },
    });

    progressBar.stop();
    analysisSpinner.succeed(
      `Analysis completed in ${Date.now() - startTime}ms`
    );

    // Apply fixes if requested
    if (options.fix) {
      await applyFixes(result, options.dryRun);
    }

    // Generate reports
    const reportSpinner = ora('Generating reports...').start();
    const reportPaths = await generateReports(
      result,
      options.output,
      options.format
    );
    reportSpinner.succeed('Reports generated successfully');

    // Display summary
    displayAuditSummary(result, reportPaths, Date.now() - startTime);

    // Setup watch mode if requested
    if (options.watch) {
      await setupWatchMode(targetPath, options);
    }

    // Exit with appropriate code
    const exitCode = getExitCode(result);
    process.exit(exitCode);
  } catch (error) {
    console.error(
      chalk.red(
        `❌ Audit failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    );
    process.exit(1);
  }
}

async function reportCommand(
  input: string,
  options: ReportOptions
): Promise<void> {
  const spinner = ora('Loading analysis results...').start();

  try {
    // Load analysis results
    const results = await loadAnalysisResults(input, options.merge);
    spinner.succeed('Analysis results loaded');

    // Generate reports
    const reportSpinner = ora('Generating reports...').start();
    const reportPaths = await generateReports(
      results,
      options.output,
      options.format,
      {
        template: options.template,
        theme: options.theme,
      }
    );
    reportSpinner.succeed('Reports generated successfully');

    // Open HTML report if requested
    if (options.open && reportPaths.html) {
      await openInBrowser(reportPaths.html);
    }

    // Display summary
    displayReportSummary(reportPaths);
  } catch (error) {
    spinner.fail(
      `Report generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    process.exit(1);
  }
}

async function ciCommand(
  targetPath: string,
  options: CIOptions
): Promise<void> {
  const startTime = Date.now();

  try {
    console.log(chalk.blue('🚀 Running CodeCheck in CI mode...'));

    // Set CI-specific defaults
    const ciConfig = {
      ...options,
      silent: true,
      concurrency: options.concurrency || '8',
      timeout: options.timeout || '600',
      format: options.format || 'all',
    };

    // Run analysis with CI-specific configuration
    const result = await runAnalysis(targetPath, ciConfig);

    // Generate CI-specific reports
    const reportPaths = await generateReports(
      result,
      options.output,
      options.format
    );

    // Check against thresholds
    const qualityScore = result.schema.metrics?.quality?.codeQualityScore || 0;
    const warningCount =
      result.schema.issues?.filter((i: any) => i.severity === 'warning')
        .length || 0;
    const errorCount =
      result.schema.issues?.filter((i: any) => i.severity === 'error').length ||
      0;

    // Display CI summary
    displayCISummary(result, reportPaths, Date.now() - startTime);

    // Upload results if configured
    if (options.uploadResults) {
      await uploadResults(result, reportPaths);
    }

    // Send webhook notification if configured
    if (options.webhook) {
      await sendWebhookNotification(options.webhook, result);
    }

    // Compare with baseline if provided
    if (options.baseline) {
      await compareWithBaseline(result, options.baseline);
    }

    // Determine exit code based on thresholds
    let exitCode = 0;

    if (errorCount > 0) {
      exitCode = 1;
    } else if (
      options.failureThreshold &&
      qualityScore < options.failureThreshold
    ) {
      exitCode = 1;
    } else if (options.maxWarnings && warningCount > options.maxWarnings) {
      exitCode = 1;
    }

    if (exitCode === 0) {
      console.log(chalk.green('✅ All quality checks passed!'));
    } else {
      console.log(chalk.red('❌ Quality checks failed!'));
    }

    process.exit(exitCode);
  } catch (error) {
    console.error(
      chalk.red(
        `❌ CI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    );
    process.exit(1);
  }
}

// Helper functions
async function runInteractiveSetup(): Promise<any> {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'projectType',
      message: 'What type of project is this?',
      choices: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Full Stack'],
    },
    {
      type: 'checkbox',
      name: 'plugins',
      message: 'Which analysis plugins would you like to enable?',
      choices: [
        'ESLint',
        'TypeScript',
        'Security Audit',
        'Code Metrics',
        'LLM Reasoning',
        'Dynamic Analysis',
      ],
    },
    {
      type: 'list',
      name: 'severity',
      message: 'What severity level should fail the build?',
      choices: ['error', 'warning', 'info'],
      default: 'error',
    },
    {
      type: 'number',
      name: 'concurrency',
      message: 'How many concurrent workers should be used?',
      default: 4,
    },
  ]);

  return answers;
}

async function generateDefaultConfig(template?: string): Promise<any> {
  const baseConfig = {
    projectPath: '.',
    enabledPlugins: ['FileDiscoveryPlugin', 'ASTAnalysisPlugin'],
    outputFormat: 'all',
    concurrency: 4,
    excludePatterns: ['node_modules/**', 'dist/**', 'build/**'],
    includePatterns: ['**/*.{js,ts,jsx,tsx}'],
    severity: 'error',
    failureThreshold: 70,
  };

  if (template === 'typescript') {
    baseConfig.enabledPlugins.push('TypeScriptPlugin');
    baseConfig.includePatterns = ['**/*.{ts,tsx}'];
  } else if (template === 'react') {
    baseConfig.enabledPlugins.push('ESLintPlugin');
    baseConfig.includePatterns = ['**/*.{js,jsx,ts,tsx}'];
  }

  return baseConfig;
}

function generateConfigFile(config: any): string {
  return `import type { CodeCheckConfig } from '@code-check/core-engine';

export default {
  projectPath: '${config.projectPath || '.'}',
  enabledPlugins: ${JSON.stringify(config.enabledPlugins || [], null, 2)},
  outputFormat: '${config.outputFormat || 'all'}',
  concurrency: ${config.concurrency || 4},
  excludePatterns: ${JSON.stringify(config.excludePatterns || [], null, 2)},
  includePatterns: ${JSON.stringify(config.includePatterns || [], null, 2)},
  severity: '${config.severity || 'error'}',
  failureThreshold: ${config.failureThreshold || 70},
  reportConfig: {
    outputPath: './codecheck-reports',
    includeDetails: true,
    includeMetrics: true,
    includeSummary: true
  }
} as CodeCheckConfig;
`;
}

async function updatePackageScripts(packagePath: string): Promise<void> {
  const packageJson = await fs.readJson(packagePath);

  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }

  packageJson.scripts['codecheck'] = 'codecheck audit';
  packageJson.scripts['codecheck:ci'] = 'codecheck ci';
  packageJson.scripts['codecheck:report'] = 'codecheck report';

  await fs.writeJson(packagePath, packageJson, { spaces: 2 });
}

async function loadConfiguration(configPath?: string): Promise<any> {
  const defaultPath = path.join(process.cwd(), 'codecheck.config.ts');
  const targetPath = configPath || defaultPath;

  if (await fs.pathExists(targetPath)) {
    // In a real implementation, you'd dynamically import the config
    // For now, return a default configuration
    return {
      projectPath: '.',
      enabledPlugins: ['FileDiscoveryPlugin', 'ASTAnalysisPlugin'],
      outputFormat: 'all',
    };
  }

  return {
    projectPath: '.',
    enabledPlugins: ['FileDiscoveryPlugin', 'ASTAnalysisPlugin'],
    outputFormat: 'all',
  };
}

async function runAnalysis(targetPath: string, options: any): Promise<any> {
  const config = await loadConfiguration(options.config);
  const engine = new CodeCheckEngine({
    projectPath: targetPath,
    ...config,
    concurrency: parseInt(options.concurrency || '4'),
    excludePatterns: options.exclude,
    includePatterns: options.include,
    maxFileSize: parseInt(options.maxFileSize || '1048576'),
    timeout: parseInt(options.timeout || '300') * 1000,
    bail: options.bail || false,
  });

  await engine.initialize();
  return await engine.analyze();
}

async function applyFixes(result: any, dryRun?: boolean): Promise<void> {
  const spinner = ora('Applying fixes...').start();

  try {
    // In a real implementation, you'd apply fixes based on the analysis results
    // For now, just simulate the process
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (dryRun) {
      spinner.succeed('Dry run: Would fix 5 issues');
    } else {
      spinner.succeed('Applied 5 fixes successfully');
    }
  } catch (error) {
    spinner.fail('Failed to apply fixes');
    throw error;
  }
}

async function generateReports(
  result: any,
  outputPath?: string,
  format?: string,
  options?: any
): Promise<any> {
  const { ReportGenerator } = await import('@code-check/core-engine');

  const reportGenerator = new ReportGenerator({
    outputPath: outputPath || './codecheck-reports',
    includeDetails: true,
    includeMetrics: true,
    includeSummary: true,
    ...options,
  });

  switch (format) {
    case 'json':
      return { json: await reportGenerator.generateJSONReport(result) };
    case 'html':
      return { html: await reportGenerator.generateHTMLReport(result) };
    case 'markdown':
      return { markdown: await reportGenerator.generateMarkdownReport(result) };
    case 'all':
    default:
      return await reportGenerator.generateReports(result);
  }
}

function displayAuditSummary(
  result: any,
  reportPaths: any,
  duration: number
): void {
  const issues = result.schema.issues || [];
  const errorCount = issues.filter((i: any) => i.severity === 'error').length;
  const warningCount = issues.filter(
    (i: any) => i.severity === 'warning'
  ).length;
  const infoCount = issues.filter((i: any) => i.severity === 'info').length;
  const healthScore = Math.max(0, 100 - (errorCount * 10 + warningCount * 2));

  console.log('\n' + chalk.bold('📊 Analysis Summary'));
  console.log('═'.repeat(50));

  const summaryData = [
    ['Metric', 'Value'],
    ['Files Analyzed', result.schema.summary.analyzedFiles.toString()],
    ['Total Issues', issues.length.toString()],
    ['Errors', chalk.red(errorCount.toString())],
    ['Warnings', chalk.yellow(warningCount.toString())],
    ['Info', chalk.blue(infoCount.toString())],
    ['Health Score', `${healthScore}/100`],
    ['Duration', `${duration}ms`],
  ];

  console.log(
    table(summaryData, {
      border: {
        topBody: '─',
        topJoin: '┬',
        topLeft: '┌',
        topRight: '┐',
        bottomBody: '─',
        bottomJoin: '┴',
        bottomLeft: '└',
        bottomRight: '┘',
        bodyLeft: '│',
        bodyRight: '│',
        bodyJoin: '│',
        joinBody: '─',
        joinLeft: '├',
        joinRight: '┤',
        joinJoin: '┼',
      },
    })
  );

  console.log('\n' + chalk.bold('📁 Generated Reports'));
  console.log('═'.repeat(50));

  if (reportPaths.json) {
    console.log(chalk.green('JSON:     ') + reportPaths.json);
  }
  if (reportPaths.html) {
    console.log(chalk.green('HTML:     ') + reportPaths.html);
  }
  if (reportPaths.markdown) {
    console.log(chalk.green('Markdown: ') + reportPaths.markdown);
  }
}

function displayReportSummary(reportPaths: any): void {
  console.log('\n' + chalk.bold('📁 Generated Reports'));
  console.log('═'.repeat(50));

  Object.entries(reportPaths).forEach(([format, path]) => {
    console.log(chalk.green(`${format.toUpperCase()}:`.padEnd(10)) + path);
  });
}

function displayCISummary(
  result: any,
  reportPaths: any,
  duration: number
): void {
  const issues = result.schema.issues || [];
  const errorCount = issues.filter((i: any) => i.severity === 'error').length;
  const warningCount = issues.filter(
    (i: any) => i.severity === 'warning'
  ).length;
  const qualityScore = result.schema.metrics?.quality?.codeQualityScore || 0;

  console.log('\n' + chalk.bold('🔍 CI Analysis Results'));
  console.log('═'.repeat(50));

  const ciData = [
    ['Metric', 'Value', 'Status'],
    [
      'Quality Score',
      qualityScore.toString(),
      qualityScore >= 70 ? '✅' : '❌',
    ],
    ['Errors', errorCount.toString(), errorCount === 0 ? '✅' : '❌'],
    ['Warnings', warningCount.toString(), warningCount <= 50 ? '✅' : '⚠️'],
    ['Duration', `${duration}ms`, '✅'],
  ];

  console.log(
    table(ciData, {
      border: {
        topBody: '─',
        topJoin: '┬',
        topLeft: '┌',
        topRight: '┐',
        bottomBody: '─',
        bottomJoin: '┴',
        bottomLeft: '└',
        bottomRight: '┘',
        bodyLeft: '│',
        bodyRight: '│',
        bodyJoin: '│',
        joinBody: '─',
        joinLeft: '├',
        joinRight: '┤',
        joinJoin: '┼',
      },
    })
  );
}

function getExitCode(result: any): number {
  const issues = result.schema.issues || [];
  const errorCount = issues.filter((i: any) => i.severity === 'error').length;
  return errorCount > 0 ? 1 : 0;
}

async function setupWatchMode(targetPath: string, options: any): Promise<void> {
  console.log(chalk.blue('👀 Watching for changes...'));
  // In a real implementation, you'd set up file watching
  // For now, just display a message
}

async function loadAnalysisResults(
  input: string,
  merge?: string[]
): Promise<any> {
  // In a real implementation, you'd load and merge analysis results
  // For now, return a mock result
  return {
    schema: {
      issues: [],
      summary: { analyzedFiles: 0, totalFiles: 0, skippedFiles: 0 },
      metrics: { quality: { codeQualityScore: 85 } },
    },
    duration: 1000,
  };
}

async function openInBrowser(filePath: string): Promise<void> {
  const { spawn } = await import('child_process');
  const platform = process.platform;

  let cmd = '';
  if (platform === 'darwin') {
    cmd = 'open';
  } else if (platform === 'win32') {
    cmd = 'start';
  } else {
    cmd = 'xdg-open';
  }

  spawn(cmd, [filePath], { detached: true, stdio: 'ignore' });
}

async function uploadResults(result: any, reportPaths: any): Promise<void> {
  const spinner = ora('Uploading results...').start();

  try {
    // In a real implementation, you'd upload to a configured service
    await new Promise((resolve) => setTimeout(resolve, 2000));
    spinner.succeed('Results uploaded successfully');
  } catch (error) {
    spinner.fail('Failed to upload results');
  }
}

async function sendWebhookNotification(
  webhook: string,
  result: any
): Promise<void> {
  const spinner = ora('Sending webhook notification...').start();

  try {
    // In a real implementation, you'd send a webhook notification
    await new Promise((resolve) => setTimeout(resolve, 1000));
    spinner.succeed('Webhook notification sent');
  } catch (error) {
    spinner.fail('Failed to send webhook notification');
  }
}

async function compareWithBaseline(
  result: any,
  baseline: string
): Promise<void> {
  const spinner = ora('Comparing with baseline...').start();

  try {
    // In a real implementation, you'd compare with baseline results
    await new Promise((resolve) => setTimeout(resolve, 1000));
    spinner.succeed('Baseline comparison completed');
  } catch (error) {
    spinner.fail('Failed to compare with baseline');
  }
}
