/**
 * Performance Monitoring System
 *
 * Tracks key performance metrics for optimization:
 * - Variation selection time
 * - L3 assembly generation time
 * - Unlock evaluation time
 * - Store action durations
 * - Render performance
 */

interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics

  /**
   * Start timing an operation
   */
  startTimer(operation: string): (metadata?: Record<string, any>) => void {
    const startTime = performance.now();

    return (metadata?: Record<string, any>) => {
      const duration = performance.now() - startTime;

      this.recordMetric({
        operation,
        duration,
        timestamp: Date.now(),
        metadata,
      });

      // Log slow operations (>100ms)
      if (duration > 100) {
        // Development warning: [Performance] Slow operation: ${operation} took ${duration.toFixed(2)}ms
      }
    };
  }

  /**
   * Record a metric
   */
  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Trim old metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Get statistics for an operation
   */
  getStats(operation: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
    p95: number;
  } | null {
    const operationMetrics = this.metrics
      .filter((m) => m.operation === operation)
      .map((m) => m.duration);

    if (operationMetrics.length === 0) {
      return null;
    }

    const sorted = operationMetrics.sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);

    return {
      count: operationMetrics.length,
      avg: operationMetrics.reduce((a, b) => a + b, 0) / operationMetrics.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p95: sorted[p95Index],
    };
  }

  /**
   * Get all operation names
   */
  getOperations(): string[] {
    return [...new Set(this.metrics.map((m) => m.operation))];
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Log performance summary to console
   */
  logSummary(): void {
    // Development log: [Performance] Summary

    for (const operation of this.getOperations()) {
      const stats = this.getStats(operation);
      if (stats) {
        // Development log: Performance stats for ${operation}
      }
    }

    // Development log: End performance summary
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Development-only: expose to window for debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).performanceMonitor = performanceMonitor;
}
