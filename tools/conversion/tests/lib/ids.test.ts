import { describe, it, expect } from 'vitest';

import { parseVariationId, generateAggregatedId, generateL3Id, validateZeroPadding, extractNodeId } from '../../lib/ids.js';
import { Logger } from '../../lib/log.js';

describe('parseVariationId', () => {
  it('should parse L1 initial variation', () => {
    const result = parseVariationId('arch-L1-initial', 1);
    expect(result).toMatchObject({
      layer: 1,
      character: 'arch',
      state: 'initial',
      number: 0,
    });
  });

  it('should parse L1 firstRevisit variation', () => {
    const result = parseVariationId('arch-L1-FR-037', 1);
    expect(result).toMatchObject({
      layer: 1,
      character: 'arch',
      state: 'firstRevisit',
      number: 37,
    });
  });

  it('should parse L2 metaAware variation with path', () => {
    const result = parseVariationId('algo-L2-accept-MA-015', 2);
    expect(result).toMatchObject({
      layer: 2,
      character: 'algo',
      path: 'accept',
      state: 'metaAware',
      number: 15,
    });
  });

  it('should parse L3 variation', () => {
    const result = parseVariationId('arch-L3-042', 3);
    expect(result).toMatchObject({
      layer: 3,
      sectionType: 'arch-L3',
      number: 42,
    });
  });

  it('should parse conv-L3 variation', () => {
    const result = parseVariationId('conv-L3-135', 3);
    expect(result).toMatchObject({
      layer: 3,
      sectionType: 'conv-L3',
      number: 135,
    });
  });

  it('should parse L4 variation', () => {
    const result = parseVariationId('final-preserve', 4);
    expect(result).toMatchObject({
      layer: 4,
      philosophy: 'preserve',
    });
  });

  it('should return null for invalid format', () => {
    expect(parseVariationId('invalid-id', 1)).toBeNull();
    expect(parseVariationId('arch-L5-001', 5 as any)).toBeNull();
  });
});

describe('generateAggregatedId', () => {
  it('should generate L1 ID with zero-padding', () => {
    expect(generateAggregatedId('arch', 1, 1)).toBe('arch-L1-001');
    expect(generateAggregatedId('arch', 1, 42)).toBe('arch-L1-042');
    expect(generateAggregatedId('arch', 1, 100)).toBe('arch-L1-100');
  });

  it('should generate L2 ID with path and zero-padding', () => {
    expect(generateAggregatedId('algo', 2, 1, 'accept')).toBe('algo-L2-accept-001');
    expect(generateAggregatedId('hum', 2, 80, 'resist')).toBe('hum-L2-resist-080');
  });
});

describe('generateL3Id', () => {
  it('should generate L3 ID with 3-digit zero-padding', () => {
    expect(generateL3Id('arch-L3', 1)).toBe('arch-L3-001');
    expect(generateL3Id('conv-L3', 42)).toBe('conv-L3-042');
    expect(generateL3Id('algo-L3', 270)).toBe('algo-L3-270');
  });
});

describe('validateZeroPadding', () => {
  it('should accept valid zero-padded IDs', () => {
    const logger = new Logger();
    expect(validateZeroPadding('arch-L1-FR-001', 1, logger)).toBe(true);
    expect(validateZeroPadding('algo-L2-accept-MA-042', 2, logger)).toBe(true);
    expect(validateZeroPadding('arch-L3-001', 3, logger)).toBe(true);
  });

  it('should reject invalid zero-padding', () => {
    const logger = new Logger();
    expect(validateZeroPadding('arch-L1-FR-1', 1, logger)).toBe(false);
    expect(validateZeroPadding('arch-L1-FR-42', 1, logger)).toBe(false);
    expect(logger.hasErrors()).toBe(true);
  });

  it('should reject L3 without 3-digit padding', () => {
    const logger = new Logger();
    expect(validateZeroPadding('arch-L3-1', 3, logger)).toBe(false);
    expect(validateZeroPadding('arch-L3-42', 3, logger)).toBe(false);
    expect(logger.hasErrors()).toBe(true);
  });
});

describe('extractNodeId', () => {
  it('should extract L1 node ID', () => {
    expect(extractNodeId('arch-L1-001', 1)).toBe('arch-L1');
    expect(extractNodeId('algo-L1-042', 1)).toBe('algo-L1');
  });

  it('should extract L2 node ID with path', () => {
    expect(extractNodeId('arch-L2-accept-001', 2)).toBe('arch-L2-accept');
    expect(extractNodeId('hum-L2-resist-080', 2)).toBe('hum-L2-resist');
  });

  it('should return null for L3 (per-file)', () => {
    expect(extractNodeId('arch-L3-001', 3)).toBeNull();
  });

  it('should return variation ID for L4', () => {
    expect(extractNodeId('final-preserve', 4)).toBe('final-preserve');
  });
});
