// lib/perf/budget.ts
// Request deadline and time budget tracker

export class RequestBudget {
  private startTime: number;
  private deadlineMs: number;

  constructor(customDeadlineMs?: number) {
    this.startTime = Date.now();
    const envDeadline = Number(process.env.GENERATION_DEADLINE_MS);
    this.deadlineMs = customDeadlineMs || (Number.isFinite(envDeadline) && envDeadline > 0 ? envDeadline : 20000);
  }

  /**
   * Elapsed time in milliseconds
   */
  get elapsedMs(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Remaining time in milliseconds before deadline
   */
  get remainingMs(): number {
    return Math.max(0, this.deadlineMs - this.elapsedMs);
  }

  /**
   * Has the generation deadline expired?
   */
  isExpired(): boolean {
    return this.remainingMs <= 0;
  }

  /**
   * Can a non-critical stage run with at least minRequiredMs?
   */
  canRunNonCritical(minRequiredMs: number = 1000): boolean {
    return this.remainingMs >= minRequiredMs;
  }
}
