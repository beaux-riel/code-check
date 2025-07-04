# Configuration Guide

## Overview

Code Check offers extensive configuration options to tailor the analysis to your project's specific needs. Configuration can be specified through configuration files, command-line options, or programmatic configuration.

## Configuration Files

### 1. Primary Configuration

Create a `codecheck.config.ts` (or `.js`) file in your project root:

```typescript
import { CodeCheckConfig } from '@code-check/core-engine';

export default {
  // Basic project settings
  projectPath: '.',
  outputPath: './.code-check',

  // File patterns
  include: ['src/**/*.ts', 'src/**/*.tsx', 'lib/**/*.js'],
  exclude: ['node_modules/**', 'dist/**', '*.test.ts'],

  // Plugin configuration
  plugins: {
    fileDiscovery: {
      enabled: true,
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      excludePatterns: ['*.test.*', '*.spec.*'],
    },

    static: {
      enabled: true,
      eslint: {
        configPath: '.eslintrc.js',
        rules: {
          'prefer-const': 'error',
          'no-unused-vars': 'warn',
        },
      },
      typescript: {
        configPath: './tsconfig.json',
        strictMode: true,
      },
    },

    codeMetrics: {
      enabled: true,
      thresholds: {
        cyclomaticComplexity: 10,
        cognitiveComplexity: 15,
        maintainabilityIndex: 70,
      },
    },

    ast: {
      enabled: true,
      analyzePatterns: true,
      detectAntiPatterns: true,
    },

    dynamic: {
      enabled: true,
      testRunner: 'jest', // or 'cypress'
      testCommand: 'npm test',
      coverageThreshold: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },

    llm: {
      enabled: true,
      provider: 'openai', // 'anthropic', 'ollama'
      model: 'gpt-4',
      maxTokens: 4000,
      temperature: 0.1,
      prompts: {
        codeReview: 'custom-prompt-template',
        securityAnalysis: 'security-focused-prompt',
      },
    },

    security: {
      enabled: true,
      snyk: {
        enabled: true,
        apiKey: process.env.SNYK_API_KEY,
      },
      npmAudit: {
        enabled: true,
        severity: 'high',
      },
    },
  },

  // Rule configuration
  rules: {
    'code-quality/cyclomatic-complexity': ['error', { max: 10 }],
    'code-quality/function-length': ['warn', { max: 50 }],
    'security/no-hardcoded-secrets': 'error',
    'security/sql-injection': 'error',
    'performance/avoid-synchronous-fs': 'warn',
    'maintainability/max-nesting-depth': ['warn', { max: 4 }],
    'design-patterns/prefer-composition': 'info',
  },

  // Severity configuration
  severity: {
    error: {
      failBuild: true,
      weight: 10,
    },
    warn: {
      failBuild: false,
      weight: 5,
    },
    info: {
      failBuild: false,
      weight: 1,
    },
  },

  // Output configuration
  output: {
    formats: ['html', 'json', 'markdown'],
    htmlReport: {
      template: 'default',
      includeSourceCode: true,
      includeMetrics: true,
    },
    jsonReport: {
      pretty: true,
      includeRawData: false,
    },
    markdownReport: {
      includeTOC: true,
      includeStats: true,
    },
  },

  // AI Provider configuration
  aiProvider: {
    type: 'openai',
    config: {
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4',
      maxTokens: 4000,
      temperature: 0.1,
    },
  },

  // Caching
  cache: {
    enabled: true,
    ttl: 3600, // 1 hour
    directory: './.code-check/cache',
  },

  // Parallel processing
  concurrency: {
    maxWorkers: 4,
    chunkSize: 100,
  },
} as CodeCheckConfig;
```

### 2. Environment-Specific Configuration

Create environment-specific config files:

```typescript
// codecheck.config.development.ts
export default {
  plugins: {
    llm: {
      enabled: false, // Disable AI in development
    },
    dynamic: {
      coverageThreshold: 60, // Lower threshold for dev
    },
  },
};

// codecheck.config.production.ts
export default {
  plugins: {
    llm: {
      enabled: true,
      model: 'gpt-4',
    },
    dynamic: {
      coverageThreshold: 90, // Higher threshold for prod
    },
  },
  output: {
    formats: ['json'], // Only JSON for CI/CD
  },
};
```

## Plugin Configuration

### Static Analysis Plugins

#### ESLint Plugin

```typescript
plugins: {
  static: {
    eslint: {
      configPath: '.eslintrc.js',
      useEslintrc: true,
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      cache: true,
      cacheLocation: '.eslintcache'
    }
  }
}
```

#### TypeScript Plugin

```typescript
plugins: {
  static: {
    typescript: {
      configPath: './tsconfig.json',
      compilerOptions: {
        strict: true,
        noImplicitAny: true
      },
      incremental: true
    }
  }
}
```

### Dynamic Analysis Plugin

#### Jest Integration

```typescript
plugins: {
  dynamic: {
    jest: {
      configPath: 'jest.config.js',
      testMatch: ['**/__tests__/**/*.test.ts'],
      collectCoverageFrom: ['src/**/*.ts'],
      coverageReporters: ['json', 'html'],
      instrumentationOptions: {
        trackFunctionCalls: true,
        trackVariableUsage: true
      }
    }
  }
}
```

#### Cypress Integration

```typescript
plugins: {
  dynamic: {
    cypress: {
      configPath: 'cypress.config.ts',
      specPattern: 'cypress/e2e/**/*.cy.ts',
      instrumentationOptions: {
        trackUserInteractions: true,
        trackPerformanceMetrics: true
      }
    }
  }
}
```

### AI/LLM Plugin

#### OpenAI Configuration

```typescript
plugins: {
  llm: {
    provider: 'openai',
    config: {
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4',
      maxTokens: 4000,
      temperature: 0.1,
      presencePenalty: 0,
      frequencyPenalty: 0
    },
    prompts: {
      codeReview: `
        Analyze this code for:
        1. Code quality issues
        2. Potential bugs
        3. Security vulnerabilities
        4. Performance improvements
        5. Best practice violations

        Provide specific, actionable recommendations.
      `,
      architecture: `
        Review the architectural patterns and suggest improvements for:
        1. Modularity
        2. Separation of concerns
        3. Maintainability
        4. Scalability
      `
    }
  }
}
```

#### Anthropic Configuration

```typescript
plugins: {
  llm: {
    provider: 'anthropic',
    config: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: 'claude-3-opus-20240229',
      maxTokens: 4000
    }
  }
}
```

#### Ollama Configuration

```typescript
plugins: {
  llm: {
    provider: 'ollama',
    config: {
      baseUrl: 'http://localhost:11434',
      model: 'codellama:7b',
      temperature: 0.1
    }
  }
}
```

## Rule Configuration

### Built-in Rules

#### Code Quality Rules

```typescript
rules: {
  'code-quality/cyclomatic-complexity': ['error', { max: 10 }],
  'code-quality/cognitive-complexity': ['warn', { max: 15 }],
  'code-quality/function-length': ['warn', { max: 50 }],
  'code-quality/parameter-count': ['warn', { max: 5 }],
  'code-quality/class-length': ['warn', { max: 300 }],
  'code-quality/file-length': ['warn', { max: 500 }],
  'code-quality/nested-depth': ['warn', { max: 4 }]
}
```

#### Security Rules

```typescript
rules: {
  'security/no-hardcoded-secrets': 'error',
  'security/no-sql-injection': 'error',
  'security/no-xss': 'error',
  'security/secure-random': 'warn',
  'security/no-eval': 'error',
  'security/validate-input': 'warn'
}
```

#### Performance Rules

```typescript
rules: {
  'performance/avoid-synchronous-fs': 'warn',
  'performance/prefer-async-await': 'info',
  'performance/avoid-memory-leaks': 'error',
  'performance/optimize-loops': 'warn',
  'performance/lazy-loading': 'info'
}
```

### Custom Rules

Create custom rules by extending the base rule class:

```typescript
// custom-rules/my-rule.ts
import { BaseRule, RuleContext, RuleResult } from '@code-check/core-engine';

export class MyCustomRule extends BaseRule {
  name = 'my-custom-rule';
  description = 'Checks for custom pattern';

  async analyze(context: RuleContext): Promise<RuleResult[]> {
    // Custom analysis logic
    return [];
  }
}

// In configuration
rules: {
  'custom/my-rule': ['error', { customOption: true }]
}
```

## Environment Variables

Set up environment variables for sensitive configuration:

```bash
# .env
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
SNYK_API_KEY=your_snyk_api_key
CODE_CHECK_OUTPUT_PATH=./reports
CODE_CHECK_CACHE_ENABLED=true
```

## Command Line Options

Override configuration with CLI flags:

```bash
# Basic options
code-check audit . --config custom.config.ts --output ./custom-output

# Plugin control
code-check audit . --disable-plugin llm --enable-plugin security

# Output format
code-check audit . --format json --format html

# Severity threshold
code-check audit . --fail-on error --ignore-warnings

# Performance options
code-check audit . --max-workers 8 --chunk-size 50

# Debugging
code-check audit . --verbose --debug
```

## Integration with CI/CD

### GitHub Actions

```yaml
- name: Code Check Analysis
  run: |
    npx @code-check/cli audit . \
      --format json \
      --output ./code-check-results.json \
      --fail-on error
```

### GitLab CI

```yaml
code_check:
  script:
    - npx @code-check/cli audit . --format json --fail-on error
  artifacts:
    reports:
      junit: code-check-results.json
```

### Jenkins

```groovy
stage('Code Analysis') {
  steps {
    sh 'npx @code-check/cli audit . --format json --output results.json'
    publishHTML([
      allowMissing: false,
      alwaysLinkToLastBuild: true,
      keepAll: true,
      reportDir: 'results',
      reportFiles: 'index.html',
      reportName: 'Code Check Report'
    ])
  }
}
```

## Best Practices

1. **Start Simple**: Begin with basic configuration and gradually add complexity
2. **Environment-Specific**: Use different configs for development, staging, and production
3. **Version Control**: Commit configuration files to ensure consistency across team
4. **Documentation**: Document custom rules and configuration decisions
5. **Regular Updates**: Review and update configuration as project evolves
6. **Performance**: Monitor analysis performance and adjust concurrency settings
7. **Security**: Use environment variables for sensitive information
8. **Integration**: Integrate with existing development workflow and tools
