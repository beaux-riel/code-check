import { RuleMetadata } from './types';

export const designPatternRules: RuleMetadata[] = [
  {
    id: 'singleton-pattern',
    name: 'Singleton Pattern Implementation',
    description:
      'Ensure singleton pattern is implemented correctly with proper instance management.',
    category: 'design-patterns',
    severity: 'warning',
    enabled: true,
    fixable: false,
    tags: ['design-pattern', 'singleton', 'architecture'],
    languages: ['javascript', 'typescript'],
    references: ['https://refactoring.guru/design-patterns/singleton'],
    examples: {
      bad: `class Singleton {
  constructor() {}
}`,
      good: `class Singleton {
  private static instance: Singleton;
  private constructor() {}
  static getInstance(): Singleton {
    if (!Singleton.instance) {
      Singleton.instance = new Singleton();
    }
    return Singleton.instance;
  }
}`,
    },
  },
  {
    id: 'factory-pattern',
    name: 'Factory Pattern Usage',
    description:
      'Use factory pattern for object creation when dealing with complex instantiation logic.',
    category: 'design-patterns',
    severity: 'info',
    enabled: true,
    fixable: false,
    tags: ['design-pattern', 'factory', 'creational'],
    languages: ['javascript', 'typescript'],
    references: ['https://refactoring.guru/design-patterns/factory-method'],
  },
  {
    id: 'observer-pattern',
    name: 'Observer Pattern Implementation',
    description:
      'Implement observer pattern correctly for event-driven architecture.',
    category: 'design-patterns',
    severity: 'info',
    enabled: true,
    fixable: false,
    tags: ['design-pattern', 'observer', 'behavioral'],
    languages: ['javascript', 'typescript'],
    references: ['https://refactoring.guru/design-patterns/observer'],
  },
  {
    id: 'strategy-pattern',
    name: 'Strategy Pattern for Algorithms',
    description:
      'Use strategy pattern to encapsulate algorithms and make them interchangeable.',
    category: 'design-patterns',
    severity: 'info',
    enabled: true,
    fixable: false,
    tags: ['design-pattern', 'strategy', 'behavioral'],
    languages: ['javascript', 'typescript'],
    references: ['https://refactoring.guru/design-patterns/strategy'],
  },
  {
    id: 'decorator-pattern',
    name: 'Decorator Pattern Usage',
    description:
      'Use decorator pattern to add behavior to objects dynamically.',
    category: 'design-patterns',
    severity: 'info',
    enabled: true,
    fixable: false,
    tags: ['design-pattern', 'decorator', 'structural'],
    languages: ['javascript', 'typescript'],
    references: ['https://refactoring.guru/design-patterns/decorator'],
  },
  {
    id: 'facade-pattern',
    name: 'Facade Pattern for Complex Subsystems',
    description:
      'Use facade pattern to provide a simplified interface to complex subsystems.',
    category: 'design-patterns',
    severity: 'info',
    enabled: true,
    fixable: false,
    tags: ['design-pattern', 'facade', 'structural'],
    languages: ['javascript', 'typescript'],
    references: ['https://refactoring.guru/design-patterns/facade'],
  },
  {
    id: 'adapter-pattern',
    name: 'Adapter Pattern for Interface Compatibility',
    description:
      'Use adapter pattern to make incompatible interfaces work together.',
    category: 'design-patterns',
    severity: 'info',
    enabled: true,
    fixable: false,
    tags: ['design-pattern', 'adapter', 'structural'],
    languages: ['javascript', 'typescript'],
    references: ['https://refactoring.guru/design-patterns/adapter'],
  },
  {
    id: 'command-pattern',
    name: 'Command Pattern for Actions',
    description: 'Use command pattern to encapsulate requests as objects.',
    category: 'design-patterns',
    severity: 'info',
    enabled: true,
    fixable: false,
    tags: ['design-pattern', 'command', 'behavioral'],
    languages: ['javascript', 'typescript'],
    references: ['https://refactoring.guru/design-patterns/command'],
  },
  {
    id: 'mvc-pattern',
    name: 'MVC Pattern Implementation',
    description:
      'Follow Model-View-Controller pattern for separation of concerns.',
    category: 'design-patterns',
    severity: 'warning',
    enabled: true,
    fixable: false,
    tags: ['design-pattern', 'mvc', 'architecture'],
    languages: ['javascript', 'typescript'],
  },
  {
    id: 'repository-pattern',
    name: 'Repository Pattern for Data Access',
    description: 'Use repository pattern to abstract data access logic.',
    category: 'design-patterns',
    severity: 'info',
    enabled: true,
    fixable: false,
    tags: ['design-pattern', 'repository', 'data-access'],
    languages: ['javascript', 'typescript'],
  },
  {
    id: 'dependency-injection',
    name: 'Dependency Injection Pattern',
    description:
      'Use dependency injection for better testability and loose coupling.',
    category: 'design-patterns',
    severity: 'info',
    enabled: true,
    fixable: false,
    tags: ['design-pattern', 'dependency-injection', 'architecture'],
    languages: ['javascript', 'typescript'],
  },
  {
    id: 'builder-pattern',
    name: 'Builder Pattern for Complex Objects',
    description:
      'Use builder pattern for constructing complex objects step by step.',
    category: 'design-patterns',
    severity: 'info',
    enabled: true,
    fixable: false,
    tags: ['design-pattern', 'builder', 'creational'],
    languages: ['javascript', 'typescript'],
    references: ['https://refactoring.guru/design-patterns/builder'],
  },
  {
    id: 'chain-of-responsibility',
    name: 'Chain of Responsibility Pattern',
    description:
      'Use chain of responsibility pattern for processing requests through a chain of handlers.',
    category: 'design-patterns',
    severity: 'info',
    enabled: true,
    fixable: false,
    tags: ['design-pattern', 'chain-of-responsibility', 'behavioral'],
    languages: ['javascript', 'typescript'],
    references: [
      'https://refactoring.guru/design-patterns/chain-of-responsibility',
    ],
  },
  {
    id: 'state-pattern',
    name: 'State Pattern for State Management',
    description:
      'Use state pattern to manage object state transitions cleanly.',
    category: 'design-patterns',
    severity: 'info',
    enabled: true,
    fixable: false,
    tags: ['design-pattern', 'state', 'behavioral'],
    languages: ['javascript', 'typescript'],
    references: ['https://refactoring.guru/design-patterns/state'],
  },
  {
    id: 'template-method-pattern',
    name: 'Template Method Pattern',
    description:
      'Use template method pattern to define algorithm structure in base class.',
    category: 'design-patterns',
    severity: 'info',
    enabled: true,
    fixable: false,
    tags: ['design-pattern', 'template-method', 'behavioral'],
    languages: ['javascript', 'typescript'],
    references: ['https://refactoring.guru/design-patterns/template-method'],
  },
  {
    id: 'prototype-pattern',
    name: 'Prototype Pattern for Object Cloning',
    description:
      'Use prototype pattern for creating objects by cloning existing instances.',
    category: 'design-patterns',
    severity: 'info',
    enabled: true,
    fixable: false,
    tags: ['design-pattern', 'prototype', 'creational'],
    languages: ['javascript', 'typescript'],
    references: ['https://refactoring.guru/design-patterns/prototype'],
  },
  {
    id: 'proxy-pattern',
    name: 'Proxy Pattern for Access Control',
    description:
      'Use proxy pattern to control access to objects or add additional behavior.',
    category: 'design-patterns',
    severity: 'info',
    enabled: true,
    fixable: false,
    tags: ['design-pattern', 'proxy', 'structural'],
    languages: ['javascript', 'typescript'],
    references: ['https://refactoring.guru/design-patterns/proxy'],
  },
  {
    id: 'composite-pattern',
    name: 'Composite Pattern for Tree Structures',
    description:
      'Use composite pattern to treat individual objects and compositions uniformly.',
    category: 'design-patterns',
    severity: 'info',
    enabled: true,
    fixable: false,
    tags: ['design-pattern', 'composite', 'structural'],
    languages: ['javascript', 'typescript'],
    references: ['https://refactoring.guru/design-patterns/composite'],
  },
];
