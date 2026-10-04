// lib/chat/contracts.ts
// Strict TypeScript contracts for XPLORA AI Chat Assistant (Phase 7, Step 56)

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface TripProposal {
  destination?: string;
  from?: string;
  durationDays?: number;
  budget?: number;
  travelStyle?: string;
  startDate?: string;
}

export type ActionCommand = 
  | 'APPLY_TRIP_DETAILS' 
  | 'EXPORT_PDF' 
  | 'EXPORT_CALENDAR' 
  | 'SAVE_TRIP';

export const ALLOWED_ACTION_COMMANDS: ReadonlySet<ActionCommand> = new Set([
  'APPLY_TRIP_DETAILS',
  'EXPORT_PDF',
  'EXPORT_CALENDAR',
  'SAVE_TRIP',
]);

export interface ChatResponseEnvelope {
  message: string;
  tripProposal?: TripProposal | null;
  actionCommand?: ActionCommand | null;
  updatedMemory?: Record<string, any>;
  isAvailable: boolean;
  correlationId?: string;
}

export interface ChatContext {
  currentItinerarySummary?: {
    destination?: string;
    durationDays?: number;
    budget?: number;
    travelStyle?: string;
  } | null;
  tripMemory?: Record<string, any>;
}
