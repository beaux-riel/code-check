# Code Check Rule Library

This directory contains the comprehensive rule library for Code Check, organized into different categories for better maintainability and usability.

## Overview

The rule library provides pre-configured rule sets for:

- **Security**: OWASP-based security rules
- **Performance**: React/Vue performance best practices
- **Design Patterns**: Common design pattern guidelines
- **Code Quality**: Maintainability and readability rules
- **Reusability**: DRY principles and modularity patterns

## Structure

```
rules/
├── index.ts              # Main export file
├── types.ts              # Type definitions
├── rule-library.ts       # Main rule library class
├── security.ts           # Security rules (OWASP-based)
├── performance.ts        # Performance rules (React/Vue)
├── design-patterns.ts    # Design pattern rules
├── code-quality.ts       # Code quality rules
├── reusability.ts        # Reusability and DRY rules
└── README.md            # This file
```

## Rule Categories

### Security Rules (`security.ts`)

Based on OWASP guidelines, includes:

- SQL Injection prevention
- XSS (Cross-Site Scripting) prevention
- CSRF protection
- Insecure randomness detection
- Hardcoded secrets detection
- Insecure deserialization
- Weak cryptography
- Path traversal prevention
- And more...

**Default Severity**: Most security rules are set to `error` or `warning`

### Performance Rules (`performance.ts`)

Framework-specific performance optimizations:

#### React Rules:

- Avoid anonymous functions in JSX
- Memoize expensive components
- Optimize useCallback dependencies
- Avoid inline object props
- Key prop optimization
- Lazy loading for routes

#### Vue Rules:

- v-for key requirements
- Computed vs methods optimization
- v-show vs v-if usage
- Functional components
- Async components

#### General Rules:

- Memory leak prevention
- Bundle size optimization
- Blocking operations avoidance
- DOM operations optimization

**Default Severity**: `warning` for critical performance issues, `info` for optimizations

### Design Patterns Rules (`design-patterns.ts`)

Implementation guidelines for common patterns:

- Singleton pattern
- Factory pattern
- Observer pattern
- Strategy pattern
- Decorator pattern
- Facade pattern
- Adapter pattern
- Command pattern
- MVC pattern
- Repository pattern
- Dependency injection
- Builder pattern
- Chain of responsibility
- And more...

**Default Severity**: Most are `info`, architectural patterns are `warning`

### Code Quality Rules (`code-quality.ts`)

Maintainability and readability:

- Cyclomatic complexity
- Function length limits
- Parameter count limits
- Nesting depth control
- Duplicate code detection
- Magic numbers elimination
- Dead code removal
- Consistent naming conventions
- Type annotations
- Error handling
- And more...

**Default Severity**: `warning` for complexity issues, `info` for style

### Reusability Rules (`reusability.ts`)

DRY principles and modularity:

- DRY principle enforcement
- Reusable function extraction
- Utility module creation
- Parameterization of hardcoded values
- Configuration objects usage
- Generic interfaces/types
- Composable functions
- Higher-order functions
- Custom hooks (React)
- Composables (Vue)
- And more...

**Default Severity**: `warning` for DRY violations, `info` for suggestions

## Rule Sets

Pre-configured combinations of rules:

### Core Rule Sets

- `security-recommended`: Essential security rules
- `performance-recommended`: General performance rules
- `react-performance`: React-specific performance rules
- `vue-performance`: Vue-specific performance rules
- `design-patterns`: Design pattern guidelines
- `code-quality-essential`: Core quality rules
- `reusability-patterns`: Reusability and DRY rules

### Combined Rule Sets

- `recommended`: Balanced set for most projects
- `strict`: High standards for enterprise projects

## Configuration

### Default Severity Levels

```typescript
{
  // Security: High priority
  'sql-injection': 'error',
  'xss-prevention': 'error',

  // Performance: Medium priority
  'react-avoid-anonymous-functions': 'warning',
  'vue-v-for-key-required': 'warning',

  // Quality: Context-dependent
  'cyclomatic-complexity': 'warning',
  'function-length': 'warning',

  // Style: Low priority
  'consistent-naming': 'info',
  'line-length': 'info'
}
```

### Customization

Rules can be customized in `codecheck.config.ts`:

```typescript
export default {
  extends: ['recommended'],
  rules: {
    'cyclomatic-complexity': {
      severity: 'error',
      configuration: { maxComplexity: 8 },
    },
    'function-length': {
      severity: 'warning',
      configuration: { maxLines: 40 },
    },
  },
  ruleSets: {
    'design-patterns': { enabled: true },
  },
};
```

## Usage

### Basic Usage

```typescript
import { ruleLibrary } from './rule-library';

// Get all enabled rules
const enabledRules = ruleLibrary.getEnabledRules();

// Get rules by category
const securityRules = ruleLibrary.getRulesByCategory('security');

// Get rules by framework
const reactRules = ruleLibrary.getRulesByFramework('react');

// Get resolved rules for specific rule sets
const rules = ruleLibrary.getResolvedRules(['recommended']);
```

### Advanced Configuration

```typescript
import { ruleLibrary } from './rule-library';

// Update rule severity
ruleLibrary.updateRuleSeverity('cyclomatic-complexity', 'error');

// Configure rule parameters
ruleLibrary.updateRuleConfiguration('function-length', {
  maxLines: 30,
});

// Enable/disable rules
ruleLibrary.enableRule('design-patterns');
ruleLibrary.disableRule('magic-numbers');
```

## Adding New Rules

To add a new rule:

1. Define the rule in the appropriate category file
2. Add appropriate metadata (tags, framework, examples)
3. Update the default configuration if needed
4. Add tests for the rule
5. Update documentation

Example:

```typescript
// In security.ts
{
  id: 'new-security-rule',
  name: 'New Security Rule',
  description: 'Description of the security issue',
  category: 'security',
  severity: 'error',
  enabled: true,
  fixable: false,
  tags: ['owasp', 'security', 'specific-tag'],
  references: ['https://owasp.org/...'],
  examples: {
    bad: '// Bad example',
    good: '// Good example'
  }
}
```

## Best Practices

1. **Severity Guidelines**:
   - `error`: Security vulnerabilities, critical bugs
   - `warning`: Performance issues, maintainability concerns
   - `info`: Style preferences, optional optimizations

2. **Configuration**:
   - Provide sensible defaults
   - Allow customization for different project needs
   - Document configuration options clearly

3. **Documentation**:
   - Include examples for complex rules
   - Provide references to official guidelines
   - Explain the reasoning behind rules

4. **Framework Support**:
   - Use framework tags for framework-specific rules
   - Provide alternatives for different frameworks when possible
   - Consider generic implementations where appropriate

## Integration

The rule library integrates with:

- **RuleRegistry**: Legacy compatibility layer
- **AnalysisPipeline**: Rule execution and validation
- **ReportGenerator**: Rule violation reporting
- **ConfigManager**: Configuration management

## Performance Considerations

- Rules are loaded lazily where possible
- Configuration changes are cached
- Rule resolution is optimized for common patterns
- Memory usage is monitored for large rule sets
