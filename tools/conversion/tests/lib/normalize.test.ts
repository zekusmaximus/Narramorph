import { describe, it, expect } from 'vitest';
import { normalizeText, validateEncoding } from '../../lib/normalize.js';
import { Logger } from '../../lib/log.js';

describe('normalizeText', () => {
  it('should strip BOM from start of file', () => {
    const input = '\uFEFFHello World';
    const result = normalizeText(input);
    expect(result.text).toBe('Hello World');
  });

  it('should convert CRLF to LF', () => {
    const input = 'Line 1\r\nLine 2\r\nLine 3';
    const result = normalizeText(input);
    expect(result.text).toBe('Line 1\nLine 2\nLine 3');
  });

  it('should remove zero-width characters', () => {
    const input = 'Hello\u200BWorld\u200C\u200D\uFEFF';
    const result = normalizeText(input);
    expect(result.text).not.toContain('\u200B');
    expect(result.text).not.toContain('\u200C');
    expect(result.text).not.toContain('\u200D');
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should remove directional marks', () => {
    const input = 'Hello\u200EWorld\u200F';
    const result = normalizeText(input);
    expect(result.text).not.toContain('\u200E');
    expect(result.text).not.toContain('\u200F');
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should convert smart quotes to ASCII', () => {
    const input = '\u201CHello\u201D \u2018World\u2019';
    const result = normalizeText(input);
    expect(result.text).toBe('"Hello" \'World\'');
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should collapse multiple spaces', () => {
    const input = 'Hello    World';
    const result = normalizeText(input);
    expect(result.text).toBe('Hello World');
  });

  it('should normalize to NFC', () => {
    // é as combining characters (e + combining acute)
    const input = 'e\u0301';
    const result = normalizeText(input);
    expect(result.text).toBe('é'); // Single NFC character
  });

  it('should detect Cyrillic homoglyphs', () => {
    const logger = new Logger();
    const input = 'Hеllo'; // 'е' is Cyrillic
    normalizeText(input, logger);
    expect(logger.hasWarnings()).toBe(true);
  });

  it('should log warnings with file path', () => {
    const logger = new Logger();
    const input = '\u201CHello\u201D'; // Smart quotes trigger warning
    normalizeText(input, logger, '/path/to/file.md');
    const infoEntries = logger.getEntriesBySeverity('INFO');
    expect(infoEntries.length).toBeGreaterThan(0);
    expect(infoEntries[0]?.file).toBe('/path/to/file.md');
  });
});

describe('validateEncoding', () => {
  it('should validate valid UTF-8 text', () => {
    expect(validateEncoding('Hello, World!')).toBe(true);
    expect(validateEncoding('Hello 世界')).toBe(true);
  });

  it('should accept emoji and special characters', () => {
    expect(validateEncoding('Hello 👋 🌍')).toBe(true);
  });
});
