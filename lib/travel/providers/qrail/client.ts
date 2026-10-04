// lib/travel/providers/qrail/client.ts
// Secure HTTP client for Qrail Railway API with policy enforcement & credential redaction

import { fetchWithPolicy } from '@/lib/http/fetchPolicy';
import { getQrailApiKey, getQrailBaseUrl } from '@/lib/config/capabilities';
import { QrailTrainsBetweenResponse, QrailErrorResponse } from './types';

export class QrailApiError extends Error {
  public statusCode?: number;
  public isAuthError: boolean;
  public isRateLimited: boolean;
  public isDownstreamError: boolean;
  public qrailMessage?: string;

  constructor(message: string, statusCode?: number, qrailMessage?: string) {
    super(message);
    this.name = 'QrailApiError';
    this.statusCode = statusCode;
    this.qrailMessage = qrailMessage;
    this.isAuthError = statusCode === 401 || statusCode === 403;
    this.isRateLimited = statusCode === 429;
    this.isDownstreamError = (statusCode !== undefined && statusCode >= 500) || statusCode === 0;
  }
}

/**
 * Strips sensitive tokens and keys from URLs before logging.
 */
export function sanitizeUrlForLog(urlStr: string): string {
  try {
    let sanitized = urlStr;
    const url = new URL(urlStr);
    for (const key of ['api_key', 'token', 'key', 'auth']) {
      if (url.searchParams.has(key)) {
        url.searchParams.set(key, 'REDACTED');
      }
    }
    sanitized = url.toString();
    sanitized = sanitized.replace(/(api_key|token|key|auth)=[^&]+/gi, '$1=REDACTED');
    sanitized = sanitized.replace(/(\/api\/v\d+\/[^/]+(?:\/[^/]+){1,3}\/)([A-Za-z0-9_-]{20,})/g, '$1REDACTED');
    return sanitized;
  } catch {
    return urlStr.replace(/(api_key|token|key|auth)=[^&]+/gi, '$1=REDACTED');
  }
}

export class QrailClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(apiKey?: string, baseUrl?: string) {
    const resolvedKey = apiKey || getQrailApiKey();
    if (!resolvedKey) {
      throw new QrailApiError('QRAIL_API_KEY is not configured on server', 401);
    }
    this.apiKey = resolvedKey;
    this.baseUrl = (baseUrl || getQrailBaseUrl()).replace(/\/+$/, '');
  }

  /**
   * Helper to execute authenticated requests via fetchWithPolicy
   */
  private async request<T>(endpoint: string, params?: Record<string, string | number | undefined>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`);

    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v).trim()) {
          url.searchParams.set(k, String(v).trim());
        }
      });
    }

    const sanitizedUrl = sanitizeUrlForLog(url.toString());

    let res: Response;
    try {
      res = await fetchWithPolicy('qrail', url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'XPLORA-Travel-Platform/1.0',
        },
      });
    } catch (err: any) {
      console.warn(`[QrailClient] Request to ${sanitizedUrl} failed network/policy check:`, err.message);
      throw new QrailApiError(`Network or timeout error contacting Qrail: ${err.message}`, 0);
    }

    const text = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {
      // Non-JSON response
      if (!res.ok) {
        throw new QrailApiError(
          `Qrail returned HTTP ${res.status}: ${text.slice(0, 150)}`,
          res.status
        );
      }
      throw new QrailApiError('Invalid JSON response returned from Qrail provider', res.status);
    }

    // Check for inline error payload (e.g. {"success":false,"message":"UnAuthorized Request"} or {"error":"..."})
    if (!res.ok || (json && json.success === false)) {
      const errorMsg = json?.Error || json?.error || json?.message || `HTTP ${res.status}`;
      const isAuth =
        res.status === 401 ||
        res.status === 403 ||
        errorMsg.toLowerCase().includes('unauthorized') ||
        errorMsg.toLowerCase().includes('disabled');

      console.warn(`[QrailClient] HTTP ${res.status} from ${sanitizedUrl}:`, errorMsg);
      throw new QrailApiError(
        `Qrail API Error (${res.status}): ${errorMsg}`,
        isAuth ? 403 : res.status,
        errorMsg
      );
    }

    return json as T;
  }

  /**
   * Fetches trains between two stations on a specific date.
   * Query params: from, to, date (YYYY-MM-DD or 'today')
   */
  public async getTrainsBetweenStations(
    fromStation: string,
    toStation: string,
    date: string
  ): Promise<QrailTrainsBetweenResponse> {
    const fromCode = fromStation.toUpperCase();
    const toCode = toStation.toUpperCase();
    const dateParam = date || 'today';

    // 1. Try official v3 REST endpoint with key in path (qrail.in/api/v3/trains/between/FROM/TO/DATE/KEY)
    try {
      return await this.request<QrailTrainsBetweenResponse>(
        `/api/v3/trains/between/${fromCode}/${toCode}/${dateParam}/${this.apiKey}`
      );
    } catch (v3Err: any) {
      // If v3 returns 404 or specific error, attempt v1 endpoint as fallback
      if (v3Err instanceof QrailApiError && v3Err.statusCode === 404) {
        return this.request<QrailTrainsBetweenResponse>('/api/v1/trains/between', {
          from: fromCode,
          to: toCode,
          date,
        });
      }
      throw v3Err;
    }
  }

  /**
   * Fetches train details or schedule by train number
   */
  public async getTrainDetails(trainNumber: string): Promise<any> {
    try {
      return await this.request<any>(`/api/v3/trains/schedule/${trainNumber}/${this.apiKey}`);
    } catch {
      return this.request<any>('/api/v1/trains/details', {
        train_number: trainNumber,
      });
    }
  }

  /**
   * Fetches live running status: /api/v3/trains/running/{trainNumber}/{date}/{apiKey}
   */
  public async getLiveRunningStatus(trainNumber: string, date?: string): Promise<any> {
    const dateParam = date || 'today';
    return this.request<any>(`/api/v3/trains/running/${trainNumber}/${dateParam}/${this.apiKey}`);
  }

  /**
   * Fetches PNR status
   */
  public async getPnrStatus(pnr: string): Promise<any> {
    return this.request<any>(`/api/v3/pnr/${pnr}/${this.apiKey}`);
  }
}
