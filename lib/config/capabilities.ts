// lib/config/capabilities.ts
// Server-only configuration and capability boundaries for XPLORA

/**
 * Ensures code running in the browser cannot read server-only secrets.
 */
function assertServerOnly() {
  if (typeof window !== 'undefined') {
    throw new Error('Security Error: Server configuration accessed on client');
  }
}

export interface TravelCapabilities {
  liveFlightsEnabled: boolean;
  liveStaysEnabled: boolean;
  geminiChatEnabled: boolean;
  liveTrainsEnabled: boolean;
  liveBusesEnabled: boolean;
}

export function getServerCapabilities(): TravelCapabilities {
  assertServerOnly();

  const serpApiKey = process.env.SERPAPI_KEY?.trim();
  const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
  const qrailApiKey = process.env.QRAIL_API_KEY?.trim();

  const liveFlightsFlag = process.env.LIVE_FLIGHTS_ENABLED;
  const liveStaysFlag = process.env.LIVE_STAYS_ENABLED;
  const geminiChatFlag = process.env.GEMINI_CHAT_ENABLED;
  const liveTrainsFlag = process.env.LIVE_TRAINS_ENABLED;

  return {
    liveFlightsEnabled: liveFlightsFlag !== 'false' && Boolean(serpApiKey),
    liveStaysEnabled: liveStaysFlag !== 'false' && Boolean(serpApiKey),
    geminiChatEnabled: geminiChatFlag !== 'false' && Boolean(geminiApiKey),
    liveTrainsEnabled: liveTrainsFlag !== 'false' && Boolean(qrailApiKey),
    liveBusesEnabled: false,
  };
}

export function getSerpApiKey(): string | null {
  assertServerOnly();
  const key = process.env.SERPAPI_KEY?.trim();
  return key && key.length > 0 ? key : null;
}

export function getGeminiApiKey(): string | null {
  assertServerOnly();
  const key = process.env.GEMINI_API_KEY?.trim();
  return key && key.length > 0 ? key : null;
}

export function getQrailApiKey(): string | null {
  assertServerOnly();
  const key = process.env.QRAIL_API_KEY?.trim();
  return key && key.length > 0 ? key : null;
}

export function getQrailBaseUrl(): string {
  assertServerOnly();
  return process.env.QRAIL_BASE_URL?.trim() || 'https://api.qrail.in';
}
