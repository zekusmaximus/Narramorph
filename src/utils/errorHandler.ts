/**
 * Error handling utilities for the narrative engine
 */

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

  // In production, send to error tracking service
  // TODO: Integrate with Sentry, LogRocket, etc.
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry.captureException(error, { extra: context });
    console.error('[Error]', error.message);
  }
}
