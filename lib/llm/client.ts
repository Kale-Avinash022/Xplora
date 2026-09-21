// lib/llm/client.ts
// Single LLM call for trip enrichment with deadline budget and factual fallback

import { fetchWithPolicy } from '@/lib/http/fetchPolicy';
import { getOrSet, normalizeKey } from '@/lib/cache';
import { CACHE_TTLS } from '@/lib/cache/ttls';

export interface PlaceSummaryItem {
  id: string;
  name: string;
  kindLabel: string;
  locality: string;
  wikipediaExtract?: string;
}

export interface PlaceEnrichedText {
  id: string;
  description: string;
}

/**
 * Fallback generator using Wikipedia extract trimmed to 2 sentences or "<kind> in <locality>."
 */
export function buildCodeFallbackText(item: PlaceSummaryItem): string {
  if (item.wikipediaExtract && item.wikipediaExtract.length > 20) {
    const sentences = item.wikipediaExtract
      .replace(/\[\d+\]/g, '')
      .trim()
      .split(/(?<=[.?!])\s+/);
    let candidate = sentences.slice(0, 2).join(' ');
    if (candidate.length > 220) {
      candidate = sentences[0].length <= 220 ? sentences[0] : candidate.slice(0, 217) + '...';
    }
    return candidate;
  }
  return `${item.kindLabel || 'Attraction'} in ${item.locality || 'the city'}.`;
}

/**
 * Execute at most ONE LLM call per trip, strict JSON, low temp, small max_tokens computed from stops.
 * Runs concurrently with enrichment as a non-blocking step.
 * If apiKey is absent or call times out / misses deadline, code-built text is returned.
 */
export async function generatePlaceSummaries(
  destination: string,
  places: PlaceSummaryItem[],
  deadlineRemainingMs?: number
): Promise<Map<string, string>> {
  const resultMap = new Map<string, string>();
  if (places.length === 0) return resultMap;

  // Fill fallbacks initially
  for (const p of places) {
    resultMap.set(p.id, buildCodeFallbackText(p));
  }

  // Check deadline budget
  if (deadlineRemainingMs !== undefined && deadlineRemainingMs < 2000) {
    return resultMap;
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return resultMap;
  }

  const model = process.env.LLM_MODEL || (process.env.GEMINI_API_KEY ? 'gemini-1.5-flash' : 'gpt-4o-mini');
  const stopsHash = places.map((p) => p.id).sort().join(',');
  const cacheKey = normalizeKey('llm', `${destination}:${stopsHash}`);

  try {
    const cachedDescriptions = await getOrSet(
      cacheKey,
      CACHE_TTLS.PLACE_DETAILS,
      async () => {
        if (process.env.GEMINI_API_KEY) {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
          const prompt = `You are a travel guide. Write concise 1-2 sentence descriptions (max 200 chars each) for these places in ${destination}:
${places.map((p, i) => `${i + 1}. [${p.id}] ${p.name} (${p.kindLabel}) in ${p.locality}`).join('\n')}
Return ONLY a valid JSON array of objects with keys "id" and "description".`;

          const res = await fetchWithPolicy('llm', url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: Math.min(1024, places.length * 50 + 100),
                responseMimeType: 'application/json',
              },
            }),
          });

          if (!res.ok) return null;
          const data = await res.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!rawText) return null;
          return JSON.parse(rawText) as PlaceEnrichedText[];
        }
        return null;
      }
    );

    if (Array.isArray(cachedDescriptions)) {
      for (const item of cachedDescriptions) {
        if (item.id && item.description) {
          resultMap.set(item.id, item.description.trim());
        }
      }
    }
  } catch (err) {
    // Graceful fallback to code-built text
  }

  return resultMap;
}
