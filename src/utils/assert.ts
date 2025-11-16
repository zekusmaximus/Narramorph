/**
 * Assertion utilities for TypeScript strict mode
 */

/**
 * Asserts that a value is defined (not null or undefined)
 * @throws Error if value is null or undefined
 */
export function assertDefined<T>(value: T | undefined | null, message?: string): asserts value is T {
  if (value === undefined || value === null) {
    throw new Error(message ?? 'Expected value to be defined');
  }
}

/**
 * Asserts that an array has at least one element
 * @throws Error if array is empty
 */
export function assertNonEmpty<T>(arr: T[], message?: string): asserts arr is [T, ...T[]] {
  if (arr.length === 0) {
    throw new Error(message ?? 'Expected array to be non-empty');
  }
}

/**
 * Gets a value from a map or throws if not found
 * @throws Error if key is not in map
 */
export function getOrThrow<K, V>(map: Map<K, V>, key: K, context?: string): V {
  const value = map.get(key);
  if (value === undefined) {
    throw new Error(context ? `${context}: Key not found in map: ${key}` : `Key not found in map: ${key}`);
  }
  return value;
}

/**
 * Gets a value from a record or throws if not found
 * @throws Error if key is not in record
 */
export function getRecordOrThrow<T>(record: Record<string, T>, key: string, context?: string): T {
  const value = record[key];
  if (value === undefined) {
    throw new Error(context ? `${context}: Key not found in record: ${key}` : `Key not found in record: ${key}`);
  }
  return value;
}
