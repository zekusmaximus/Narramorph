import { describe, expect, it } from 'vitest';

import { parseEnumListOption, parseEnumOption, parseIntegerOption } from '../../lib/cli.js';

describe('conversion CLI argument parsing', () => {
  it('applies defaults and upper bounds to integer options', () => {
    expect(
      parseIntegerOption(undefined, {
        name: '--parallel',
        defaultValue: 4,
        max: 10,
      }),
    ).toBe(4);
    expect(
      parseIntegerOption('24', {
        name: '--parallel',
        defaultValue: 4,
        max: 10,
      }),
    ).toBe(10);
  });

  it('rejects fractional, non-numeric, and out-of-range integers', () => {
    const option = { name: '--parallel', defaultValue: 4 };
    expect(() => parseIntegerOption('2.5', option)).toThrow('--parallel must be a whole number');
    expect(() => parseIntegerOption('fast', option)).toThrow('--parallel must be a whole number');
    expect(() => parseIntegerOption('0', option)).toThrow('--parallel must be at least 1');
  });

  it('parses enum values and comma-separated enum lists without assertions', () => {
    const layers = ['L1', 'L2', 'L3', 'L4'] as const;
    expect(parseEnumOption(undefined, layers, 'L1', '--layer')).toBe('L1');
    expect(parseEnumOption('L3', layers, 'L1', '--layer')).toBe('L3');
    expect(parseEnumListOption('L1, L3', layers, layers, '--layers')).toEqual(['L1', 'L3']);
  });

  it('rejects unsupported enum values', () => {
    const layers = ['L1', 'L2', 'L3', 'L4'] as const;
    expect(() => parseEnumOption('L5', layers, 'L1', '--layer')).toThrow(
      '--layer must be one of: L1, L2, L3, L4',
    );
    expect(() => parseEnumListOption('L1,L5', layers, layers, '--layers')).toThrow(
      '--layers must contain only: L1, L2, L3, L4',
    );
  });
});
