import { describe, expect, it } from 'vitest';

import {
  parseRuntimeProfile,
  selectRuntimeVariations,
  type RuntimeProfile,
} from '../../lib/runtime-profile.js';

const validProfile: RuntimeProfile = {
  schemaVersion: '1.0.0',
  authoredVariationCounts: {
    layer1PerNode: 81,
    layer2PerNode: 81,
  },
  runtimeSelection: {
    layer1: {
      'arch-L1': ['arch-L1-001', 'arch-L1-003'],
      'algo-L1': ['algo-L1-001'],
      'hum-L1': ['hum-L1-002'],
    },
  },
};

describe('runtime profile', () => {
  it('parses explicit authored counts and L1 selections', () => {
    expect(parseRuntimeProfile(validProfile)).toEqual(validProfile);
  });

  it('rejects duplicate selected IDs', () => {
    expect(() =>
      parseRuntimeProfile({
        ...validProfile,
        runtimeSelection: {
          layer1: {
            ...validProfile.runtimeSelection.layer1,
            'arch-L1': ['arch-L1-001', 'arch-L1-001'],
          },
        },
      }),
    ).toThrow('contains duplicate IDs');
  });

  it('keeps profile order and rejects missing selected records', () => {
    const variations = [
      { id: 'arch-L1-001', content: 'one' },
      { id: 'arch-L1-002', content: 'two' },
      { id: 'arch-L1-003', content: 'three' },
    ];

    expect(selectRuntimeVariations('arch-L1', variations, validProfile)).toEqual([
      variations[0],
      variations[2],
    ]);

    expect(() => selectRuntimeVariations('algo-L1', variations, validProfile)).toThrow(
      'selects missing variation algo-L1-001',
    );
  });
});
