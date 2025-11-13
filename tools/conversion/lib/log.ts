/**
 * Structured logging with error codes and severity levels
 */

export type Severity = 'BLOCKER' | 'ERROR' | 'WARNING' | 'INFO';

export interface LogEntry {
  code: string;
  severity: Severity;
  message: string;
  file?: string;
  field?: string;
  value?: unknown;
  validOptions?: string[];
  exampleFix?: string;
  timestamp: string;
}

export class Logger {
  private entries: LogEntry[] = [];
  private verbose: boolean;

  constructor(verbose = false) {
    this.verbose = verbose;
  }

  log(
    code: string,
    severity: Severity,
    message: string,
    context?: Partial<Omit<LogEntry, 'code' | 'severity' | 'message' | 'timestamp'>>,
  ): void {
    const entry: LogEntry = {
      code,
      severity,
      message,
      timestamp: new Date().toISOString(),
      ...context,
    };

    this.entries.push(entry);

    if (this.verbose || severity === 'BLOCKER' || severity === 'ERROR') {
      this.printEntry(entry);
    }
  }

  blocker(
    code: string,
    message: string,
    context?: Partial<Omit<LogEntry, 'code' | 'severity' | 'message' | 'timestamp'>>,
  ): void {
    this.log(code, 'BLOCKER', message, context);
  }

  error(
    code: string,
    message: string,
    context?: Partial<Omit<LogEntry, 'code' | 'severity' | 'message' | 'timestamp'>>,
  ): void {
    this.log(code, 'ERROR', message, context);
  }

  warning(
    code: string,
    message: string,
    context?: Partial<Omit<LogEntry, 'code' | 'severity' | 'message' | 'timestamp'>>,
  ): void {
    this.log(code, 'WARNING', message, context);
  }

  info(
    code: string,
    message: string,
    context?: Partial<Omit<LogEntry, 'code' | 'severity' | 'message' | 'timestamp'>>,
  ): void {
    this.log(code, 'INFO', message, context);
  }

  private printEntry(entry: LogEntry): void {
    const prefix = `[${entry.severity}] ${entry.code}:`;
    const location = entry.file ? ` (${entry.file})` : '';
    console.error(`${prefix}${location} ${entry.message}`);

    if (entry.field) {
      console.error(`  Field: ${entry.field}`);
    }
    if (entry.value !== undefined) {
      console.error(`  Value: ${JSON.stringify(entry.value)}`);
    }
    if (entry.validOptions && entry.validOptions.length > 0) {
      console.error(`  Valid options: ${entry.validOptions.join(', ')}`);
    }
    if (entry.exampleFix) {
      console.error(`  Fix: ${entry.exampleFix}`);
    }
  }

  getEntries(): LogEntry[] {
    return [...this.entries];
  }

  getEntriesBySeverity(severity: Severity): LogEntry[] {
    return this.entries.filter((e) => e.severity === severity);
  }

  hasBlockers(): boolean {
    return this.entries.some((e) => e.severity === 'BLOCKER');
  }

  hasErrors(): boolean {
    return this.entries.some((e) => e.severity === 'ERROR');
  }

  hasWarnings(): boolean {
    return this.entries.some((e) => e.severity === 'WARNING');
  }

  getCounts(): Record<Severity, number> {
    const counts: Record<Severity, number> = {
      BLOCKER: 0,
      ERROR: 0,
      WARNING: 0,
      INFO: 0,
    };

    for (const entry of this.entries) {
      counts[entry.severity]++;
    }

    return counts;
  }

  clear(): void {
    this.entries = [];
  }

  summary(): string {
    const counts = this.getCounts();
    return `Blockers: ${counts.BLOCKER}, Errors: ${counts.ERROR}, Warnings: ${counts.WARNING}`;
  }
}
