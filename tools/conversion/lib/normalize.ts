/**
 * Text normalization utilities
 * - NFC normalization
 * - BOM stripping
 * - CRLF → LF conversion
 * - Zero-width character removal
 * - Smart quote conversion
 * - Homoglyph detection
 */

import { Logger } from './log.js';

const ZERO_WIDTH_CHARS = /[\u200B\u200C\u200D\uFEFF]/g;
const DIRECTIONAL_MARKS = /[\u200E\u200F]/g;
const SMART_QUOTES = /[\u2018\u2019\u201C\u201D]/g;
const MULTIPLE_SPACES = /  +/g;

// Cyrillic characters that look like Latin
const CYRILLIC_HOMOGLYPHS: Record<string, string> = {
  А: 'A',
  В: 'B',
  Е: 'E',
  К: 'K',
  М: 'M',
  Н: 'H',
  О: 'O',
  Р: 'P',
  С: 'C',
  Т: 'T',
  Х: 'X',
  а: 'a',
  е: 'e',
  о: 'o',
  р: 'p',
  с: 'c',
  х: 'x',
};

export interface NormalizationResult {
  text: string;
  warnings: string[];
}

/**
 * Normalize text according to plan specifications
 */
export function normalizeText(
  text: string,
  logger?: Logger,
  filePath?: string,
): NormalizationResult {
  const warnings: string[] = [];
  let normalized = text;

  // Strip BOM
  if (normalized.charCodeAt(0) === 0xfeff) {
    normalized = normalized.slice(1);
  }

  // Convert CRLF → LF
  normalized = normalized.replace(/\r\n/g, '\n');

  // Normalize to NFC
  normalized = normalized.normalize('NFC');

  // Remove zero-width characters
  const hadZeroWidth = ZERO_WIDTH_CHARS.test(normalized);
  normalized = normalized.replace(ZERO_WIDTH_CHARS, '');

  if (hadZeroWidth) {
    const warning = 'Removed zero-width characters (ZWSP, ZWJ, ZWNJ, BOM)';
    warnings.push(warning);
    logger?.warning('NORMALIZE_ZERO_WIDTH', warning, { file: filePath });
  }

  // Remove directional marks
  const hadDirectional = DIRECTIONAL_MARKS.test(normalized);
  normalized = normalized.replace(DIRECTIONAL_MARKS, '');

  if (hadDirectional) {
    const warning = 'Removed directional marks (LRM, RLM)';
    warnings.push(warning);
    logger?.warning('NORMALIZE_DIRECTIONAL', warning, { file: filePath });
  }

  // Convert smart quotes to ASCII
  const hadSmartQuotes = SMART_QUOTES.test(normalized);
  normalized = normalized.replace(/[\u2018\u2019]/g, "'");
  normalized = normalized.replace(/[\u201C\u201D]/g, '"');

  if (hadSmartQuotes) {
    const warning = 'Converted smart quotes to ASCII';
    warnings.push(warning);
    logger?.info('NORMALIZE_SMART_QUOTES', warning, { file: filePath });
  }

  // Collapse multiple spaces
  normalized = normalized.replace(MULTIPLE_SPACES, ' ');

  // Check for illegal control characters (except tab, newline, carriage return)
  const illegalControl = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/;
  if (illegalControl.test(normalized)) {
    const warning = 'Illegal control characters detected';
    warnings.push(warning);
    logger?.blocker('UTF8_INVALID', warning, {
      file: filePath,
      exampleFix: 'Remove control characters from source file',
    });
  }

  // Detect homoglyphs (warning only)
  const homoglyphs = detectHomoglyphs(normalized);
  if (homoglyphs.length > 0) {
    const warning = `Potential homoglyphs detected: ${homoglyphs.join(', ')}`;
    warnings.push(warning);
    logger?.warning('HOMOGLYPH_DETECTED', warning, {
      file: filePath,
      exampleFix: 'Review for Cyrillic characters that look like Latin',
    });
  }

  return { text: normalized, warnings };
}

/**
 * Detect Cyrillic homoglyphs that look like Latin
 */
function detectHomoglyphs(text: string): string[] {
  const found: string[] = [];

  for (const [cyrillic, latin] of Object.entries(CYRILLIC_HOMOGLYPHS)) {
    if (text.includes(cyrillic)) {
      found.push(`'${cyrillic}' (Cyrillic) looks like '${latin}' (Latin)`);
    }
  }

  return found;
}

/**
 * Validate UTF-8 encoding (basic check)
 */
export function validateEncoding(text: string): boolean {
  try {
    // Try to encode/decode as UTF-8
    const encoder = new TextEncoder();
    const decoder = new TextDecoder('utf-8', { fatal: true });
    const encoded = encoder.encode(text);
    decoder.decode(encoded);
    return true;
  } catch {
    return false;
  }
}
