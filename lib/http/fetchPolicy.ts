// lib/http/fetchPolicy.ts
// HTTP client with per-provider timeouts, 1-retry with jittered backoff on 429/5xx, circuit breaker, and concurrency limit

export type ProviderName =
  | 'opentripmap'
  | 'pexels'
  | 'unsplash'
  | 'weather'
  | 'overpass'
  | 'llm'
  | 'flights_hotels';

interface ProviderPolicy {
  timeoutMs: number;
  allowRetry: boolean;
}

const PROVIDER_POLICIES: Record<ProviderName, ProviderPolicy> = {
  opentripmap: { timeoutMs: 6000, allowRetry: true },
  pexels: { timeoutMs: 6000, allowRetry: true },
  unsplash: { timeoutMs: 6000, allowRetry: true },
  weather: { timeoutMs: 5000, allowRetry: false },
  overpass: { timeoutMs: 12000, allowRetry: false },
  llm: { timeoutMs: 25000, allowRetry: false },
  flights_hotels: { timeoutMs: 6000, allowRetry: false },
};

interface CircuitState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime: number;
  openUntil: number;
}

const circuitStates = new Map<ProviderName, CircuitState>();

function getCircuitState(provider: ProviderName): CircuitState {
  let s = circuitStates.get(provider);
  if (!s) {
    s = { state: 'CLOSED', failureCount: 0, lastFailureTime: 0, openUntil: 0 };
    circuitStates.set(provider, s);
  }
  return s;
}

function recordSuccess(provider: ProviderName) {
  const s = getCircuitState(provider);
  s.state = 'CLOSED';
  s.failureCount = 0;
  s.openUntil = 0;
}

function recordFailure(provider: ProviderName) {
  const s = getCircuitState(provider);
  const now = Date.now();
  // If last failure was > 60s ago, reset failure count
  if (now - s.lastFailureTime > 60000) {
    s.failureCount = 0;
  }
  s.failureCount++;
  s.lastFailureTime = now;

  // After 3 consecutive failures or timeouts within 60s, open circuit for 10 minutes
  if (s.failureCount >= 3) {
    s.state = 'OPEN';
    s.openUntil = now + 10 * 60 * 1000; // 10 minutes
    console.warn(`[CircuitBreaker] Circuit for provider "${provider}" is now OPEN for 10 minutes (3 consecutive failures).`);
  }
}

export class CircuitBreakerOpenError extends Error {
  public readonly provider: ProviderName;
  constructor(provider: ProviderName) {
    super(`Provider "${provider}" is currently unavailable (circuit breaker open)`);
    this.name = 'CircuitBreakerOpenError';
    this.provider = provider;
  }
}

/**
 * fetchWithPolicy:
 * - Checks circuit breaker (OPEN -> fast rejection; HALF_OPEN -> single probe).
 * - Per-provider timeout: OpenTripMap 6s, Pexels 6s, Unsplash 6s, weather 5s, Overpass 12s, LLM 25s, flights/hotels 6s.
 * - No retries, except ONE retry for GET requests on 429/5xx with a 300 ms jittered backoff for OpenTripMap, Pexels and Unsplash.
 */
export async function fetchWithPolicy(
  provider: ProviderName,
  url: string,
  options?: RequestInit
): Promise<Response> {
  const now = Date.now();
  const circuit = getCircuitState(provider);

  if (circuit.state === 'OPEN') {
    if (now >= circuit.openUntil) {
      // Transition to HALF_OPEN to probe
      circuit.state = 'HALF_OPEN';
      console.log(`[CircuitBreaker] Provider "${provider}" entering HALF_OPEN probe state.`);
    } else {
      throw new CircuitBreakerOpenError(provider);
    }
  }

  const policy = PROVIDER_POLICIES[provider] || { timeoutMs: 6000, allowRetry: false };
  const method = (options?.method || 'GET').toUpperCase();
  const maxAttempts = policy.allowRetry && method === 'GET' ? 2 : 1;

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), policy.timeoutMs);

    try {
      // Combine caller signal with timeout controller if provided
      let signal: AbortSignal = controller.signal;
      if (options?.signal) {
        // Any abort on either signal
        const callerSignal = options.signal;
        if (callerSignal.aborted) {
          controller.abort();
        } else {
          callerSignal.addEventListener('abort', () => controller.abort(), { once: true });
        }
      }

      const res = await fetch(url, {
        ...options,
        signal,
      });

      clearTimeout(timeout);

      // Check retry conditions: 429 or 5xx on GET for allowed providers
      if ((res.status === 429 || res.status >= 500) && attempt < maxAttempts) {
        // 300 ms jittered backoff: 300ms + random [0, 150]ms
        const jitter = Math.floor(Math.random() * 150);
        await new Promise((r) => setTimeout(r, 300 + jitter));
        continue;
      }

      if (res.ok) {
        recordSuccess(provider);
        return res;
      }

      if (res.status >= 500 || res.status === 429) {
        recordFailure(provider);
      }

      return res;
    } catch (err: unknown) {
      clearTimeout(timeout);
      lastError = err;

      if (attempt < maxAttempts) {
        const jitter = Math.floor(Math.random() * 150);
        await new Promise((r) => setTimeout(r, 300 + jitter));
        continue;
      }

      recordFailure(provider);
      throw err;
    }
  }

  throw lastError || new Error(`fetchWithPolicy failed for ${provider} at ${url}`);
}

/**
 * mapLimit: run an async mapper across an array with concurrency limit (default 6)
 */
export async function mapLimit<T, R>(
  items: T[],
  limit: number = 6,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return [];
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const idx = nextIndex++;
      if (idx >= items.length) break;
      results[idx] = await fn(items[idx], idx);
    }
  }

  const workerCount = Math.min(limit, items.length);
  const workers = Array.from({ length: workerCount }, () => worker());
  await Promise.all(workers);
  return results;
}
