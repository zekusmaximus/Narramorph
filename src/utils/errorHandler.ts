/**
 * Error handling utilities for the narrative engine
 */

import { reportError } from './errorReporting';

export class NarrativeEngineError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'NarrativeEngineError';
  }
}

/**
 * Handle errors with logging and optional reporting
 */
export function handleError(error: Error, context?: Record<string, unknown>): void {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error]', error.message, context);
    console.error(error);
  }

  // In production, forward to the opt-in, redacted error reporter (Batch 8.3).
  // reportError is a no-op unless the reader consented and a DSN is configured; it
  // never receives `context` (which may carry app detail) — only the error itself,
  // and even that is scrubbed by the redaction layer before send.
  if (process.env.NODE_ENV === 'production') {
    console.error('[Error]', error.message);
    reportError(error);
  }
}
