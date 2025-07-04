import { RuleMetadata } from './types';

export const reusabilityRules: RuleMetadata[] = [
  {
    id: 'dry-principle',
    name: "DRY Principle - Don't Repeat Yourself",
    description: 'Avoid code duplication by extracting common functionality.',
    category: 'reusability',
    severity: 'warning',
    enabled: true,
    fixable: false,
    tags: ['dry', 'duplication', 'abstraction'],
    languages: ['javascript', 'typescript'],
    references: ['https://en.wikipedia.org/wiki/Don%27t_repeat_yourself'],
  },
  {
    id: 'extract-reusable-functions',
    name: 'Extract Reusable Functions',
    description: 'Extract common code patterns into reusable functions.',
    category: 'reusability',
    severity: 'info',
    enabled: true,
    fixable: false,
    tags: ['functions', 'extraction', 'modularity'],
    languages: ['javascript', 'typescript'],
  },
  {
    id: 'create-utility-modules',
    name: 'Create Utility Modules',
    description: 'Group related utility functions into dedicated modules.',
    category: 'reusability',
    severity: 'info',
    enabled: true,
    fixable: false,
    tags: ['utilities', 'modules', 'organization'],
    languages: ['javascript', 'typescript'],
  },
  {
    id: 'parameterize-hardcoded-values',
    name: 'Parameterize Hardcoded Values',
    description:
      'Make functions more reusable by parameterizing hardcoded values.',
    category: 'reusability',
    severity: 'warning',
    enabled: true,
    fixable: false,
    tags: ['parameters', 'flexibility', 'configuration'],
    languages: ['javascript', 'typescript'],
    examples: {
      bad: `function validateEmail(email) {
  return email.includes('@gmail.com');
}`,
      good: `function validateEmail(email, domain = '@gmail.com') {
  return email.includes(domain);
}`,
    },
  },
  {
    id: 'use-configuration-objects',
    name: 'Use Configuration Objects',
    description:
      'Use configuration objects for functions with many parameters.',
    category: 'reusability',
    severity: 'info',
    enabled: true,
    fixable: false,
    tags: ['configuration', 'parameters', 'flexibility'],
    languages: ['javascript', 'typescript'],
    examples: {
      bad: `function createUser(name, email, age, role, department, isActive) { ... }`,
      good: `function createUser(config) {
  const { name, email, age, role, department, isActive = true } = config;
  // ...
}`,
    },
  },
  {
    id: 'generic-interfaces',
    name: 'Generic Interfaces and Types',
    description: 'Create generic interfaces and types for reusability.',
    category: 'reusability',
    severity: 'info',
    enabled: true,
    fixable: false,
    tags: ['generics', 'types', 'typescript'],
    languages: ['typescript'],
    examples: {
      bad: `interface UserResponse {
  data: User;
  message: string;
}`,
      good: `interface ApiResponse<T> {
  data: T;
  message: string;
}`,
    },
  },
  {
    id: 'composable-functions',
    name: 'Composable Functions',
    description:
      'Design functions to be easily composable with other functions.',
    category: 'reusability',
    severity: 'info',
    enabled: true,
    fixable: false,
    tags: ['composition', 'functional', 'modularity'],
    languages: ['javascript', 'typescript'],
  },
  {
    id: 'higher-order-functions',
    name: 'Higher-Order Functions',
    description:
      'Use higher-order functions to create flexible and reusable code.',
    category: 'reusability',
    severity: 'info',
    enabled: true,
    fixable: false,
    tags: ['higher-order', 'functional', 'abstraction'],
    languages: ['javascript', 'typescript'],
    examples: {
      good: `const withLogging = (fn) => (...args) => {
  console.log('Calling function with args:', args);
  return fn(...args);
};`,
    },
  },
  {
    id: 'custom-hooks',
    name: 'Custom React Hooks',
    description:
      'Extract stateful logic into custom React hooks for reusability.',
    category: 'reusability',
    severity: 'info',
    enabled: true,
    fixable: false,
    tags: ['react', 'hooks', 'stateful-logic'],
    framework: 'react',
    languages: ['javascript', 'typescript'],
    examples: {
      good: `function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(initialValue);
  // ... implementation
  return [value, setValue];
}`,
    },
  },
  {
    id: 'vue-composables',
    name: 'Vue Composables',
    description: 'Extract reusable logic into Vue composables.',
    category: 'reusability',
    severity: 'info',
    enabled: true,
    fixable: false,
    tags: ['vue', 'composables', 'composition-api'],
    framework: 'vue',
    languages: ['javascript', 'typescript'],
  },
  {
    id: 'shared-constants',
    name: 'Shared Constants',
    description: 'Extract constants into shared modules to avoid duplication.',
    category: 'reusability',
    severity: 'warning',
    enabled: true,
    fixable: false,
    tags: ['constants', 'sharing', 'configuration'],
    languages: ['javascript', 'typescript'],
  },
  {
    id: 'reusable-components',
    name: 'Reusable Components',
    description: 'Design components to be reusable across different contexts.',
    category: 'reusability',
    severity: 'info',
    enabled: true,
    fixable: false,
    tags: ['components', 'props', 'flexibility'],
    languages: ['javascript', 'typescript'],
  },
  {
    id: 'abstract-base-classes',
    name: 'Abstract Base Classes',
    description:
      'Use abstract base classes to define common interfaces and behavior.',
    category: 'reusability',
    severity: 'info',
    enabled: true,
    fixable: false,
    tags: ['inheritance', 'abstraction', 'base-classes'],
    languages: ['typescript'],
  },
  {
    id: 'mixins-and-traits',
    name: 'Mixins and Traits',
    description: 'Use mixins or composition to share behavior across classes.',
    category: 'reusability',
    severity: 'info',
    enabled: true,
    fixable: false,
    tags: ['mixins', 'composition', 'behavior-sharing'],
    languages: ['javascript', 'typescript'],
  },
  {
    id: 'plugin-architecture',
    name: 'Plugin Architecture',
    description: 'Design systems with plugin architecture for extensibility.',
    category: 'reusability',
    severity: 'info',
    enabled: true,
    fixable: false,
    tags: ['plugins', 'extensibility', 'architecture'],
    languages: ['javascript', 'typescript'],
  },
  {
    id: 'event-driven-architecture',
    name: 'Event-Driven Architecture',
    description:
      'Use events to decouple components and make them more reusable.',
    category: 'reusability',
    severity: 'info',
    enabled: true,
    fixable: false,
    tags: ['events', 'decoupling', 'architecture'],
    languages: ['javascript', 'typescript'],
  },
  {
    id: 'dependency-injection-pattern',
    name: 'Dependency Injection for Reusability',
    description:
      'Use dependency injection to make components more flexible and testable.',
    category: 'reusability',
    severity: 'info',
    enabled: true,
    fixable: false,
    tags: ['dependency-injection', 'flexibility', 'testing'],
    languages: ['javascript', 'typescript'],
  },
  {
    id: 'template-method-reusability',
    name: 'Template Method for Code Reuse',
    description: 'Use template method pattern to share algorithm structure.',
    category: 'reusability',
    severity: 'info',
    enabled: true,
    fixable: false,
    tags: ['template-method', 'algorithms', 'inheritance'],
    languages: ['javascript', 'typescript'],
  },
  {
    id: 'factory-for-reusability',
    name: 'Factory Pattern for Object Creation',
    description:
      'Use factory patterns to create reusable object creation logic.',
    category: 'reusability',
    severity: 'info',
    enabled: true,
    fixable: false,
    tags: ['factory', 'object-creation', 'patterns'],
    languages: ['javascript', 'typescript'],
  },
  {
    id: 'modular-css',
    name: 'Modular CSS',
    description: 'Create reusable CSS classes and components.',
    category: 'reusability',
    severity: 'info',
    enabled: true,
    fixable: false,
    tags: ['css', 'modules', 'styling'],
    languages: ['css', 'scss', 'less'],
  },
  {
    id: 'api-client-abstraction',
    name: 'API Client Abstraction',
    description:
      'Abstract API clients for reusability across different endpoints.',
    category: 'reusability',
    severity: 'info',
    enabled: true,
    fixable: false,
    tags: ['api', 'http', 'abstraction'],
    languages: ['javascript', 'typescript'],
  },
  {
    id: 'validation-schemas',
    name: 'Reusable Validation Schemas',
    description: 'Create reusable validation schemas for forms and data.',
    category: 'reusability',
    severity: 'info',
    enabled: true,
    fixable: false,
    tags: ['validation', 'schemas', 'forms'],
    languages: ['javascript', 'typescript'],
  },
];
