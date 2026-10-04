// lib/llm/client.ts
// Single LLM call for trip enrichment with deadline budget and factual fallback

import { fetchWithPolicy } from '@/lib/http/fetchPolicy';
import { getOrSet, normalizeKey } from '@/lib/cache';
import { CACHE_TTLS } from '@/lib/cache/ttls';
import { ChatMessage, ChatContext, ChatResponseEnvelope } from '@/lib/chat/contracts';
import { getGeminiApiKey } from '@/lib/config/capabilities';

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
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
          const prompt = `You are a travel guide. Write concise 1-2 sentence descriptions (max 200 chars each) for these places in ${destination}:
${places.map((p, i) => `${i + 1}. [${p.id}] ${p.name} (${p.kindLabel}) in ${p.locality}`).join('\n')}
Return ONLY a valid JSON array of objects with keys "id" and "description".`;

          const res = await fetchWithPolicy('llm', url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': process.env.GEMINI_API_KEY.trim(),
            },
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

/**
 * Step 57 & Step 58: Server-Side Gemini Chat Helper with Strict System Prompt
 */
export async function generateGeminiChatReply(
  messages: ChatMessage[],
  context?: ChatContext
): Promise<ChatResponseEnvelope | null> {
  const apiKey = getGeminiApiKey() || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const model = process.env.GEMINI_CHAT_MODEL || process.env.LLM_MODEL || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const systemInstruction = `You are XPLORA AI Travel Planning Assistant, NOT a booking engine.
Core Truthfulness and Behavior Rules:
- Never claim that a booking, ticket, flight seat, hotel room, or payment is confirmed.
- Never invent live flight schedules, hotel prices, or artificial deep-links.
- You can help users brainstorm destinations, pick dates, set budgets, choose travel styles, or request actions.
- Allowlisted action commands are strictly: "APPLY_TRIP_DETAILS", "EXPORT_PDF", "EXPORT_CALENDAR", "SAVE_TRIP". If no action is needed, return null.
- When the user asks to plan a trip, change a destination, adjust dates, or set a budget, extract the structured parameters into "tripProposal" and set "actionCommand" to "APPLY_TRIP_DETAILS".
- Valid travelStyle options are: "Adventure", "Family", "Solo Explorer", "Luxury", "Budget Friendly".
- Valid durationDays is an integer between 1 and 30.
- Output MUST be valid JSON adhering strictly to this format:
{
  "message": "A friendly, helpful response explaining what you understood and any travel advice",
  "tripProposal": {
    "destination": "string or undefined",
    "from": "string or undefined",
    "durationDays": number or undefined,
    "budget": number or undefined,
    "travelStyle": "Adventure" | "Family" | "Solo Explorer" | "Luxury" | "Budget Friendly" or undefined,
    "startDate": "YYYY-MM-DD or undefined"
  } | null,
  "actionCommand": "APPLY_TRIP_DETAILS" | "EXPORT_PDF" | "EXPORT_CALENDAR" | "SAVE_TRIP" | null,
  "updatedMemory": { ...key-value pairs of user preferences }
}`;

  const formattedContents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const contextNote = context?.currentItinerarySummary 
    ? `\nActive Itinerary Context: ${JSON.stringify(context.currentItinerarySummary)}`
    : '';

  try {
    const res = await fetchWithPolicy('llm', url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey.trim(),
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction + contextNote }],
        },
        contents: formattedContents,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!res.ok) {
      console.warn(`Gemini chat call returned status ${res.status}`);
      return null;
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    const parsed = JSON.parse(rawText);
    return {
      message: parsed.message || 'I have noted your travel preferences.',
      tripProposal: parsed.tripProposal || null,
      actionCommand: parsed.actionCommand || null,
      updatedMemory: parsed.updatedMemory || {},
      isAvailable: true,
    };
  } catch (err) {
    console.error('Gemini chat helper error:', err);
    return null;
  }
}
