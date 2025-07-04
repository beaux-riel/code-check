#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Check coverage thresholds across all packages
 */
function checkCoverage() {
  const coverageDir = path.join(__dirname, '../coverage');
  const threshold = 90;

  if (!fs.existsSync(coverageDir)) {
    console.error(
      '❌ Coverage directory not found. Run tests with coverage first.'
    );
    process.exit(1);
  }

  const coverageSummaryPath = path.join(coverageDir, 'coverage-summary.json');

  if (!fs.existsSync(coverageSummaryPath)) {
    console.error(
      '❌ Coverage summary not found. Run tests with coverage first.'
    );
    process.exit(1);
  }

  try {
    const coverageData = JSON.parse(
      fs.readFileSync(coverageSummaryPath, 'utf8')
    );
    const { total } = coverageData;

    console.log('📊 Coverage Report:');
    console.log('==================');

    const metrics = ['lines', 'functions', 'branches', 'statements'];
    let allMetricsPassed = true;

    metrics.forEach((metric) => {
      const coverage = total[metric];
      const percentage = coverage.pct;
      const passed = percentage >= threshold;

      const status = passed ? '✅' : '❌';
      const color = passed ? '\x1b[32m' : '\x1b[31m';
      const reset = '\x1b[0m';

      console.log(
        `${status} ${metric.padEnd(12)}: ${color}${percentage.toFixed(2)}%${reset} (${coverage.covered}/${coverage.total})`
      );

      if (!passed) {
        allMetricsPassed = false;
      }
    });

    console.log('==================');

    if (allMetricsPassed) {
      console.log('✅ All coverage thresholds met!');
      process.exit(0);
    } else {
      console.log(
        `❌ Coverage below ${threshold}% threshold. Please add more tests.`
      );
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error reading coverage data:', error.message);
    process.exit(1);
  }
}

/**
 * Generate a detailed coverage report
 */
function generateDetailedReport() {
  const coverageDir = path.join(__dirname, '../coverage');
  const packagesDir = path.join(__dirname, '../packages');

  console.log('📋 Detailed Coverage Report by Package:');
  console.log('========================================');

  // Check each package for coverage
  const packages = fs.readdirSync(packagesDir).filter((item) => {
    const packagePath = path.join(packagesDir, item);
    return fs.statSync(packagePath).isDirectory();
  });

  packages.forEach((packageName) => {
    const packageCoverageDir = path.join(packagesDir, packageName, 'coverage');

    if (fs.existsSync(packageCoverageDir)) {
      const summaryPath = path.join(
        packageCoverageDir,
        'coverage-summary.json'
      );

      if (fs.existsSync(summaryPath)) {
        try {
          const data = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
          const { total } = data;

          console.log(`\n📦 ${packageName}:`);
          console.log(`   Lines:      ${total.lines.pct.toFixed(2)}%`);
          console.log(`   Functions:  ${total.functions.pct.toFixed(2)}%`);
          console.log(`   Branches:   ${total.branches.pct.toFixed(2)}%`);
          console.log(`   Statements: ${total.statements.pct.toFixed(2)}%`);
        } catch (error) {
          console.log(`\n📦 ${packageName}: ❌ Error reading coverage`);
        }
      } else {
        console.log(`\n📦 ${packageName}: ⚠️  No coverage data`);
      }
    } else {
      console.log(`\n📦 ${packageName}: ⚠️  No coverage directory`);
    }
  });
}

// Main execution
const command = process.argv[2];

switch (command) {
  case 'check':
    checkCoverage();
    break;
  case 'report':
    generateDetailedReport();
    break;
  default:
    console.log('Usage: node check-coverage.js [check|report]');
    console.log('  check  - Check if coverage meets 90% threshold');
    console.log('  report - Generate detailed coverage report');
    process.exit(1);
}
