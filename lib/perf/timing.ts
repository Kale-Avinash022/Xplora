// lib/perf/timing.ts
// Performance instrumentation: stage timer, JSON logger, and Server-Timing header builder

export interface TimingRecord {
  stage: string;
  durationMs: number;
}

export interface PerfMetrics {
  requestId: string;
  destination: string;
  totalMs: number;
  stages: Record<string, number>;
  cache: {
    hits: number;
    misses: number;
    stale: number;
  };
  timeouts: number;
  providerFailures: Record<string, number>;
}

export class RequestTracker {
  public readonly requestId: string;
  public readonly destination: string;
  private startTime: number;
  private stageTimings: TimingRecord[] = [];
  public cacheHits: number = 0;
  public cacheMisses: number = 0;
  public cacheStale: number = 0;
  public timeouts: number = 0;
  public providerFailures: Record<string, number> = {};

  constructor(destination: string, requestId?: string) {
    this.requestId = requestId || `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    this.destination = destination;
    this.startTime = Date.now();
  }

  /**
   * Time an asynchronous operation stage
   */
  public async timeStage<T>(stage: string, fn: () => Promise<T>): Promise<T> {
    const t0 = Date.now();
    try {
      return await fn();
    } finally {
      const dur = Date.now() - t0;
      this.stageTimings.push({ stage, durationMs: dur });
    }
  }

  public recordCacheHit(): void {
    this.cacheHits++;
  }

  public recordCacheMiss(): void {
    this.cacheMisses++;
  }

  public recordCacheStale(): void {
    this.cacheStale++;
  }

  public recordTimeout(provider: string): void {
    this.timeouts++;
    this.providerFailures[provider] = (this.providerFailures[provider] || 0) + 1;
  }

  public recordProviderFailure(provider: string): void {
    this.providerFailures[provider] = (this.providerFailures[provider] || 0) + 1;
  }

  /**
   * Finalize and construct Server-Timing header value
   */
  public getServerTimingHeader(): string {
    const totalMs = Date.now() - this.startTime;
    const parts = this.stageTimings.map(
      (t) => `${t.stage.replace(/[^a-zA-Z0-9_-]/g, '_')};dur=${t.durationMs}`
    );
    parts.unshift(`total;dur=${totalMs}`);
    return parts.join(', ');
  }

  /**
   * Log ONE JSON line if PERF_LOG=1 (or always if enabled)
   */
  public logMetrics(): PerfMetrics {
    const totalMs = Date.now() - this.startTime;
    const stagesObj: Record<string, number> = {};
    for (const t of this.stageTimings) {
      stagesObj[t.stage] = (stagesObj[t.stage] || 0) + t.durationMs;
    }

    const metrics: PerfMetrics = {
      requestId: this.requestId,
      destination: this.destination,
      totalMs,
      stages: stagesObj,
      cache: {
        hits: this.cacheHits,
        misses: this.cacheMisses,
        stale: this.cacheStale,
      },
      timeouts: this.timeouts,
      providerFailures: this.providerFailures,
    };

    if (process.env.PERF_LOG === '1' || process.env.NODE_ENV !== 'production') {
      console.log(`[PERF_LOG] ${JSON.stringify(metrics)}`);
    }

    return metrics;
  }
}
