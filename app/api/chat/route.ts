// app/api/chat/route.ts
// Genuine Google Gemini Chat Integration with Structured Proposals (Phase 7, Steps 56–63)

import { NextResponse } from 'next/server';
import { 
  ChatMessage, 
  ChatResponseEnvelope, 
  ALLOWED_ACTION_COMMANDS, 
  TripProposal,
  ActionCommand 
} from '@/lib/chat/contracts';
import { generateGeminiChatReply } from '@/lib/llm/client';
import { getGeminiApiKey } from '@/lib/config/capabilities';

export const runtime = 'nodejs';

/**
 * Step 60: Sanitize and validate LLM-generated trip proposals
 */
function sanitizeProposal(rawProposal: any): TripProposal | null {
  if (!rawProposal || typeof rawProposal !== 'object') {
    return null;
  }

  const proposal: TripProposal = {};

  if (typeof rawProposal.destination === 'string' && rawProposal.destination.trim()) {
    proposal.destination = rawProposal.destination.trim().slice(0, 80);
  }

  if (typeof rawProposal.from === 'string' && rawProposal.from.trim()) {
    proposal.from = rawProposal.from.trim().slice(0, 80);
  }

  const durationNum = Number(rawProposal.durationDays);
  if (Number.isInteger(durationNum) && durationNum >= 1 && durationNum <= 30) {
    proposal.durationDays = durationNum;
  }

  const budgetNum = Number(rawProposal.budget);
  if (!isNaN(budgetNum) && budgetNum > 0 && budgetNum <= 10000000) {
    proposal.budget = Math.round(budgetNum);
  }

  const validStyles = ['Adventure', 'Family', 'Solo Explorer', 'Luxury', 'Budget Friendly'];
  if (typeof rawProposal.travelStyle === 'string') {
    const matchedStyle = validStyles.find(
      (s) => s.toLowerCase() === rawProposal.travelStyle.toLowerCase()
    );
    if (matchedStyle) proposal.travelStyle = matchedStyle;
  }

  if (typeof rawProposal.startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawProposal.startDate)) {
    proposal.startDate = rawProposal.startDate;
  }

  return Object.keys(proposal).length > 0 ? proposal : null;
}

/**
 * Step 60: Sanitize and validate allowlisted action commands
 */
function sanitizeActionCommand(command: any): ActionCommand | null {
  if (typeof command === 'string' && ALLOWED_ACTION_COMMANDS.has(command as ActionCommand)) {
    return command as ActionCommand;
  }
  return null;
}

export async function POST(req: Request) {
  const startTime = Date.now();
  const correlationId = `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const body = await req.json();
    const rawMessages = Array.isArray(body?.messages) ? body.messages : [];
    const currentItinerary = body?.currentItinerary;
    const tripMemory = typeof body?.tripMemory === 'object' && body?.tripMemory !== null ? body.tripMemory : {};

    // Step 62: Chat Request Payload Bounding & Sanitization
    // Limit to max 10 recent messages, bounded to 500 chars each
    const boundedMessages: ChatMessage[] = rawMessages
      .slice(-10)
      .map((m: any) => ({
        role: m?.role === 'assistant' ? 'assistant' : 'user',
        content: String(m?.content || '').slice(0, 500).trim(),
      }))
      .filter((m: ChatMessage) => m.content.length > 0);

    // Concise summary context of current itinerary only (reject unbounded raw payloads)
    const contextSummary = currentItinerary
      ? {
          destination: currentItinerary.destination,
          durationDays: currentItinerary.durationDays,
          budget: currentItinerary.totalBudget,
          travelStyle: currentItinerary.travelStyle,
        }
      : null;

    // Check if Gemini service is configured
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      // Step 61: Graceful Unavailable Chat Response
      const unavailableEnvelope: ChatResponseEnvelope = {
        message: 'AI travel chat is currently unavailable because the Gemini service is unconfigured or temporarily unavailable.',
        isAvailable: false,
        tripProposal: null,
        actionCommand: null,
        correlationId,
      };
      return NextResponse.json(unavailableEnvelope, { status: 200 });
    }

    if (boundedMessages.length === 0) {
      return NextResponse.json({
        message: '👋 Hi! I am your XPLORA AI Travel Planning Assistant. Where would you like to explore next?',
        isAvailable: true,
        tripProposal: null,
        actionCommand: null,
        correlationId,
      }, { status: 200 });
    }

    // Step 57: Execute Gemini call with policy protection
    const reply = await generateGeminiChatReply(boundedMessages, {
      currentItinerarySummary: contextSummary,
      tripMemory,
    });

    if (!reply) {
      // Step 61: Graceful fallback on upstream failure
      const fallbackEnvelope: ChatResponseEnvelope = {
        message: 'AI travel chat is temporarily unavailable. Please try your request again in a few moments.',
        isAvailable: false,
        tripProposal: null,
        actionCommand: null,
        correlationId,
      };
      return NextResponse.json(fallbackEnvelope, { status: 200 });
    }

    // Step 60: Server-side validation of proposal and actionCommand
    const validatedProposal = sanitizeProposal(reply.tripProposal);
    const validatedAction = sanitizeActionCommand(reply.actionCommand);

    const updatedMemory = {
      ...tripMemory,
      ...(reply.updatedMemory || {}),
      ...(validatedProposal || {}),
    };

    const responseEnvelope: ChatResponseEnvelope = {
      message: reply.message,
      tripProposal: validatedProposal,
      actionCommand: validatedAction,
      updatedMemory,
      isAvailable: true,
      correlationId,
    };

    // Step 63: Redacted Operational Logging
    const latencyMs = Date.now() - startTime;
    console.log(`[CHAT_LOG] correlationId=${correlationId} latencyMs=${latencyMs} isAvailable=true hasProposal=${Boolean(validatedProposal)} action=${validatedAction || 'none'}`);

    return NextResponse.json(responseEnvelope, { status: 200 });
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    // Step 63: Operational Logging (no secrets or user identity)
    console.error(`[CHAT_ERROR] correlationId=${correlationId} latencyMs=${latencyMs} errorClass=${err?.name || 'Error'}`);

    const errorEnvelope: ChatResponseEnvelope = {
      message: 'AI travel chat encountered an unexpected issue. Please try again.',
      isAvailable: false,
      tripProposal: null,
      actionCommand: null,
      correlationId,
    };
    return NextResponse.json(errorEnvelope, { status: 200 });
  }
}
