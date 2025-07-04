import { describe, it, expect } from 'vitest';
import {
  success,
  failure,
  isSuccess,
  isFailure,
  kebabCase,
  camelCase,
  pascalCase,
  snakeCase,
  unique,
  groupBy,
  pick,
  omit,
  isString,
  isNumber,
  isObject,
  formatDate,
  generateId,
  isValidEmail,
  isValidUrl,
  isValidSemver,
} from '../helpers/index.js';

describe('Result utilities', () => {
  it('should create success result', () => {
    const result = success('test data');
    expect(isSuccess(result)).toBe(true);
    expect(result.success).toBe(true);
    if (isSuccess(result)) {
      expect(result.data).toBe('test data');
    }
  });

  it('should create failure result', () => {
    const error = new Error('test error');
    const result = failure(error);
    expect(isFailure(result)).toBe(true);
    expect(result.success).toBe(false);
    if (isFailure(result)) {
      expect(result.error).toBe(error);
    }
  });
});

describe('String utilities', () => {
  it('should convert to kebab-case', () => {
    expect(kebabCase('CamelCaseString')).toBe('camel-case-string');
    expect(kebabCase('snake_case_string')).toBe('snake-case-string');
    expect(kebabCase('Title Case String')).toBe('title-case-string');
  });

  it('should convert to camelCase', () => {
    expect(camelCase('kebab-case-string')).toBe('kebabCaseString');
    expect(camelCase('snake_case_string')).toBe('snakeCaseString');
    expect(camelCase('Title Case String')).toBe('titleCaseString');
  });

  it('should convert to PascalCase', () => {
    expect(pascalCase('kebab-case-string')).toBe('KebabCaseString');
    expect(pascalCase('snake_case_string')).toBe('SnakeCaseString');
    expect(pascalCase('title case string')).toBe('TitleCaseString');
  });

  it('should convert to snake_case', () => {
    expect(snakeCase('CamelCaseString')).toBe('camel_case_string');
    expect(snakeCase('kebab-case-string')).toBe('kebab_case_string');
    expect(snakeCase('Title Case String')).toBe('title_case_string');
  });
});

describe('Array utilities', () => {
  it('should remove duplicates', () => {
    expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
    expect(unique(['a', 'b', 'b', 'c'])).toEqual(['a', 'b', 'c']);
  });

  it('should group by key', () => {
    const items = [
      { type: 'fruit', name: 'apple' },
      { type: 'fruit', name: 'banana' },
      { type: 'vegetable', name: 'carrot' },
    ];

    const grouped = groupBy(items, (item) => item.type);
    expect(grouped.fruit).toHaveLength(2);
    expect(grouped.vegetable).toHaveLength(1);
  });
});

describe('Object utilities', () => {
  it('should pick specified keys', () => {
    const obj = { a: 1, b: 2, c: 3, d: 4 };
    expect(pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 });
  });

  it('should omit specified keys', () => {
    const obj = { a: 1, b: 2, c: 3, d: 4 };
    expect(omit(obj, ['b', 'd'])).toEqual({ a: 1, c: 3 });
  });
});

describe('Type guards', () => {
  it('should identify strings', () => {
    expect(isString('hello')).toBe(true);
    expect(isString(123)).toBe(false);
    expect(isString(null)).toBe(false);
  });

  it('should identify numbers', () => {
    expect(isNumber(123)).toBe(true);
    expect(isNumber('123')).toBe(false);
    expect(isNumber(NaN)).toBe(false);
  });

  it('should identify objects', () => {
    expect(isObject({})).toBe(true);
    expect(isObject([])).toBe(false);
    expect(isObject(null)).toBe(false);
    expect(isObject('string')).toBe(false);
  });
});

describe('Date utilities', () => {
  it('should format dates', () => {
    const date = new Date('2023-01-01T12:00:00.000Z');
    expect(formatDate(date, 'iso')).toBe('2023-01-01T12:00:00.000Z');
    expect(typeof formatDate(date, 'short')).toBe('string');
    expect(typeof formatDate(date, 'long')).toBe('string');
  });
});

describe('ID generation', () => {
  it('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
    expect(typeof id1).toBe('string');
    expect(typeof id2).toBe('string');
  });

  it('should generate IDs with prefix', () => {
    const id = generateId('test');
    expect(id.startsWith('test-')).toBe(true);
  });
});

describe('Validation utilities', () => {
  it('should validate emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('invalid-email')).toBe(false);
    expect(isValidEmail('test@')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
  });

  it('should validate URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('http://localhost:3000')).toBe(true);
    expect(isValidUrl('invalid-url')).toBe(false);
    expect(isValidUrl('ftp://example.com')).toBe(true);
  });

  it('should validate semver', () => {
    expect(isValidSemver('1.0.0')).toBe(true);
    expect(isValidSemver('1.0.0-alpha.1')).toBe(true);
    expect(isValidSemver('1.0.0+build.1')).toBe(true);
    expect(isValidSemver('1.0')).toBe(false);
    expect(isValidSemver('invalid')).toBe(false);
  });
});
