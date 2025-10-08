import { describe, it, expect } from 'vitest';
import { parseEventFromFileName } from './eventParser.js';

describe('parseEventFromFileName', () => {
  it('should parse event name with date using dashes', () => {
    const result = parseEventFromFileName('examples/Tech Networking Mixer on 3-15-25.txt');

    expect(result.eventName).toBe('Tech Networking Mixer on 3-15-25');
    expect(result.fileName).toBe('Tech Networking Mixer on 3-15-25.txt');
  });

  it('should parse event name with date using slashes', () => {
    const result = parseEventFromFileName('examples/Tech Meetup on 3-15-25.txt');

    expect(result.eventName).toBe('Tech Meetup on 3-15-25');
    expect(result.fileName).toBe('Tech Meetup on 3-15-25.txt');
  });

  it('should handle file without .txt extension', () => {
    const result = parseEventFromFileName('Coffee Chat on 12-1-25');

    expect(result.eventName).toBe('Coffee Chat on 12-1-25');
    expect(result.fileName).toBe('Coffee Chat on 12-1-25');
  });

  it('should handle full path', () => {
    const result = parseEventFromFileName('/Users/test/events/Networking Event on 5-20-25.txt');

    expect(result.eventName).toBe('Networking Event on 5-20-25');
    expect(result.fileName).toBe('Networking Event on 5-20-25.txt');
  });

  it('should handle simple filename without date', () => {
    const result = parseEventFromFileName('names.txt');

    expect(result.eventName).toBe('names');
    expect(result.fileName).toBe('names.txt');
  });

  it('should handle filename with spaces and no date', () => {
    const result = parseEventFromFileName('My Contact List.txt');

    expect(result.eventName).toBe('My Contact List');
    expect(result.fileName).toBe('My Contact List.txt');
  });

  it('should handle case-insensitive .txt extension', () => {
    const result = parseEventFromFileName('Event.TXT');

    expect(result.eventName).toBe('Event');
    expect(result.fileName).toBe('Event.TXT');
  });

  it('should handle filename with only extension', () => {
    const result = parseEventFromFileName('.txt');

    expect(result.eventName).toBe('');
    expect(result.fileName).toBe('.txt');
  });
});
