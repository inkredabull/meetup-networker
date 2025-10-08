import { describe, it, expect } from 'vitest';
import { parseName, parseNameList } from './nameParser.js';

describe('parseName', () => {
  it('should parse valid first and last name', () => {
    const result = parseName('John Doe');

    expect(result.isValid).toBe(true);
    expect(result.firstName).toBe('John');
    expect(result.lastName).toBe('Doe');
    expect(result.original).toBe('John Doe');
  });

  it('should handle names with multiple spaces', () => {
    const result = parseName('Jane   Smith');

    expect(result.isValid).toBe(true);
    expect(result.firstName).toBe('Jane');
    expect(result.lastName).toBe('Smith');
  });

  it('should take first and last part when middle name present', () => {
    const result = parseName('John Michael Doe');

    expect(result.isValid).toBe(true);
    expect(result.firstName).toBe('John');
    expect(result.lastName).toBe('Doe');
  });

  it('should mark single name as invalid', () => {
    const result = parseName('lance');

    expect(result.isValid).toBe(false);
    expect(result.firstName).toBeUndefined();
    expect(result.lastName).toBeUndefined();
    expect(result.original).toBe('lance');
  });

  it('should mark empty string as invalid', () => {
    const result = parseName('');

    expect(result.isValid).toBe(false);
    expect(result.firstName).toBeUndefined();
    expect(result.lastName).toBeUndefined();
  });

  it('should mark whitespace-only string as invalid', () => {
    const result = parseName('   ');

    expect(result.isValid).toBe(false);
  });

  it('should trim leading and trailing whitespace', () => {
    const result = parseName('  Alice Johnson  ');

    expect(result.isValid).toBe(true);
    expect(result.firstName).toBe('Alice');
    expect(result.lastName).toBe('Johnson');
  });
});

describe('parseNameList', () => {
  it('should parse multiple names from text', () => {
    const content = `Alice Johnson
Bob Smith
charlie
Diana Martinez`;

    const results = parseNameList(content);

    expect(results).toHaveLength(4);
    expect(results[0].isValid).toBe(true);
    expect(results[0].firstName).toBe('Alice');
    expect(results[1].isValid).toBe(true);
    expect(results[1].firstName).toBe('Bob');
    expect(results[2].isValid).toBe(false);
    expect(results[3].isValid).toBe(true);
    expect(results[3].firstName).toBe('Diana');
  });

  it('should skip empty lines', () => {
    const content = `John Doe

Jane Smith`;

    const results = parseNameList(content);

    expect(results).toHaveLength(2);
    expect(results[0].firstName).toBe('John');
    expect(results[1].firstName).toBe('Jane');
  });

  it('should handle empty content', () => {
    const results = parseNameList('');

    expect(results).toHaveLength(0);
  });

  it('should handle content with only whitespace lines', () => {
    const content = `

  `;

    const results = parseNameList(content);

    expect(results).toHaveLength(0);
  });
});
