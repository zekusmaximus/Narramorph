/**
 * Text similarity detection using MinHash + LSH
 * For detecting >95% similar variations within same group
 */

import { Logger } from './log.js';

const SHINGLE_SIZE = 3;
const NUM_HASHES = 100;
const LSH_BANDS = 20;
const LSH_ROWS = 5; // NUM_HASHES / LSH_BANDS
const SIMILARITY_THRESHOLD = 0.95;

/**
 * Generate character-level shingles from text
 */
function generateShingles(text: string, size: number): Set<string> {
  const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim();
  const shingles = new Set<string>();

  for (let i = 0; i <= normalized.length - size; i++) {
    shingles.add(normalized.slice(i, i + size));
  }

  return shingles;
}

/**
 * Simple hash function for strings
 */
function hashString(str: string, seed: number): number {
  let hash = seed;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Generate MinHash signature for text
 */
function generateMinHashSignature(shingles: Set<string>, numHashes: number): number[] {
  const signature: number[] = new Array(numHashes).fill(Infinity);

  for (const shingle of shingles) {
    for (let i = 0; i < numHashes; i++) {
      const hash = hashString(shingle, i);
      signature[i] = Math.min(signature[i]!, hash);
    }
  }

  return signature;
}

/**
 * Estimate Jaccard similarity from MinHash signatures
 */
function estimateSimilarity(sig1: number[], sig2: number[]): number {
  if (sig1.length !== sig2.length) {
    throw new Error('Signatures must have same length');
  }

  let matches = 0;
  for (let i = 0; i < sig1.length; i++) {
    if (sig1[i] === sig2[i]) {
      matches++;
    }
  }

  return matches / sig1.length;
}

/**
 * Generate LSH bucket keys for signature
 */
function generateLSHBuckets(signature: number[], bands: number, rows: number): string[] {
  const buckets: string[] = [];

  for (let band = 0; band < bands; band++) {
    const start = band * rows;
    const bandSignature = signature.slice(start, start + rows);
    const bucketKey = `band${band}-${bandSignature.join(',')}`;
    buckets.push(bucketKey);
  }

  return buckets;
}

export interface SimilarityResult {
  id1: string;
  id2: string;
  similarity: number;
}

export interface VariationText {
  id: string;
  content: string;
  groupKey: string; // e.g., "arch-L1-firstRevisit" or "algo-L3-accept"
}

/**
 * Detect similar variations within same group using MinHash + LSH
 */
export function detectSimilarVariations(
  variations: VariationText[],
  logger?: Logger,
): SimilarityResult[] {
  const results: SimilarityResult[] = [];

  // Group variations by groupKey
  const groups = new Map<string, VariationText[]>();
  for (const variation of variations) {
    const group = groups.get(variation.groupKey) || [];
    group.push(variation);
    groups.set(variation.groupKey, group);
  }

  // Process each group independently
  for (const groupVariations of groups.values()) {
    if (groupVariations.length < 2) continue;

    // Generate MinHash signatures
    const signatures = new Map<string, number[]>();
    for (const variation of groupVariations) {
      const shingles = generateShingles(variation.content, SHINGLE_SIZE);
      const signature = generateMinHashSignature(shingles, NUM_HASHES);
      signatures.set(variation.id, signature);
    }

    // Build LSH buckets
    const buckets = new Map<string, string[]>();
    for (const [id, signature] of signatures) {
      const bucketKeys = generateLSHBuckets(signature, LSH_BANDS, LSH_ROWS);
      for (const bucketKey of bucketKeys) {
        const bucket = buckets.get(bucketKey) || [];
        bucket.push(id);
        buckets.set(bucketKey, bucket);
      }
    }

    // Find candidate pairs (in same bucket)
    const candidatePairs = new Set<string>();
    for (const bucket of buckets.values()) {
      if (bucket.length < 2) continue;

      for (let i = 0; i < bucket.length; i++) {
        for (let j = i + 1; j < bucket.length; j++) {
          const id1 = bucket[i]!;
          const id2 = bucket[j]!;
          const pairKey = [id1, id2].sort().join('|');
          candidatePairs.add(pairKey);
        }
      }
    }

    // Check similarity for candidate pairs
    for (const pairKey of candidatePairs) {
      const [id1, id2] = pairKey.split('|');
      const sig1 = signatures.get(id1!)!;
      const sig2 = signatures.get(id2!)!;

      const similarity = estimateSimilarity(sig1, sig2);

      if (similarity >= SIMILARITY_THRESHOLD) {
        results.push({ id1: id1!, id2: id2!, similarity });

        logger?.warning(
          'SIMILARITY_HIGH',
          `High similarity (${(similarity * 100).toFixed(1)}%) between ${id1} and ${id2}`,
          {
            value: similarity,
            exampleFix: 'Review variations for potential duplicate content',
          },
        );
      }
    }
  }

  return results;
}

/**
 * Calculate exact Jaccard similarity (for testing)
 */
export function calculateExactSimilarity(text1: string, text2: string): number {
  const shingles1 = generateShingles(text1, SHINGLE_SIZE);
  const shingles2 = generateShingles(text2, SHINGLE_SIZE);

  const intersection = new Set([...shingles1].filter((s) => shingles2.has(s)));
  const union = new Set([...shingles1, ...shingles2]);

  return intersection.size / union.size;
}
