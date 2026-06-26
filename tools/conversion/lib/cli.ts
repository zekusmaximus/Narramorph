export interface IntegerOption {
  name: string;
  defaultValue: number;
  min?: number;
  max?: number;
}

export function parseIntegerOption(
  value: string | undefined,
  { name, defaultValue, min = 1, max }: IntegerOption,
): number {
  if (value === undefined) {
    return defaultValue;
  }
  if (!/^\d+$/.test(value)) {
    throw new Error(`${name} must be a whole number`);
  }

  const parsed = Number.parseInt(value, 10);
  if (parsed < min) {
    throw new Error(`${name} must be at least ${min}`);
  }
  return max === undefined ? parsed : Math.min(parsed, max);
}

export function parseEnumOption<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  defaultValue: T,
  name: string,
): T {
  if (value === undefined) {
    return defaultValue;
  }
  for (const allowedValue of allowed) {
    if (value === allowedValue) {
      return allowedValue;
    }
  }
  throw new Error(`${name} must be one of: ${allowed.join(', ')}`);
}

export function parseEnumListOption<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  defaultValue: readonly T[],
  name: string,
): T[] {
  if (value === undefined) {
    return [...defaultValue];
  }
  const parsed: T[] = [];
  for (const item of value.split(',').map((entry) => entry.trim())) {
    let matched: T | undefined;
    for (const allowedValue of allowed) {
      if (item === allowedValue) {
        matched = allowedValue;
        break;
      }
    }
    if (matched === undefined) {
      throw new Error(`${name} must contain only: ${allowed.join(', ')}`);
    }
    parsed.push(matched);
  }
  return parsed;
}
