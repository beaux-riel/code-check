# Basic TypeScript Sample Project

This is a basic TypeScript project that demonstrates how to use Code Check for analysis.

## Project Structure

```
basic-typescript/
├── src/
│   ├── index.ts          # Main application entry point
│   ├── utils/
│   │   ├── helpers.ts    # Utility functions
│   │   └── types.ts      # Type definitions
│   └── services/
│       └── api.ts        # API service
├── tests/
│   └── utils.test.ts     # Unit tests
├── codecheck.config.ts   # Code Check configuration
├── package.json
├── tsconfig.json
└── README.md
```

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run Code Check analysis:

   ```bash
   npx @code-check/cli audit .
   ```

3. View the generated report in `.code-check/report.html`

## Configuration

The project includes a custom Code Check configuration (`codecheck.config.ts`) that:

- Enables static analysis with TypeScript and ESLint
- Configures code quality rules
- Sets up AI-powered analysis
- Generates HTML and JSON reports

## Expected Analysis Results

Running Code Check on this project will detect:

- Code quality issues (complexity, maintainability)
- TypeScript type errors
- ESLint violations
- Security vulnerabilities
- Performance improvements
- AI-powered suggestions

## Learning Objectives

This sample demonstrates:

1. Basic Code Check setup and configuration
2. Integration with TypeScript projects
3. Custom rule configuration
4. Report generation and interpretation
5. Best practices for code quality
