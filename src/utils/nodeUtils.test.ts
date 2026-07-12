import { describe, expect, it } from 'vitest';

import { getNodeLayer, isL3Node, isL4Node } from './nodeUtils';

describe('node layer routing', () => {
  it('recognizes convergence and named terminal nodes', () => {
    expect(isL3Node('arch-L3')).toBe(true);
    expect(isL4Node('hum-L4-final')).toBe(true);
    expect(isL4Node('final-preserve')).toBe(true);
    expect(getNodeLayer('algo-L2-resist')).toBe(2);
  });
});
