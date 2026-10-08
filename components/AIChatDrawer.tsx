'use client';

import React, { useState } from 'react';
import { TripProposal, ActionCommand } from '@/lib/chat/contracts';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  tripProposal?: TripProposal | null;
  actionCommand?: ActionCommand | null;
  isApplied?: boolean;
}

interface AIChatDrawerProps {
  currentItinerary?: any;
  currentUser?: { id: string; name: string; email: string } | null;
  onUpdateItinerary?: (updatedPlan: any) => void;
  onCreateTripFromChat?: (params: TripProposal) => void;
  onExecuteActionCommand?: (command: 'EXPORT_PDF' | 'SAVE_TRIP' | 'EXPORT_CALENDAR') => void;
}

export function AIChatDrawer({
  currentItinerary,
  currentUser,
  onUpdateItinerary,
  onCreateTripFromChat,
  onExecuteActionCommand,
}: AIChatDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isServiceAvailable, setIsServiceAvailable] = useState<boolean>(true);
  const [tripMemory, setTripMemory] = useState<Record<string, any>>({});
  const [appliedProposalIds, setAppliedProposalIds] = useState<Set<number>>(new Set());

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '👋 Hi! I am your XPLORA AI Travel Assistant. Ask me to recommend destinations, customize durations, adjust budgets, or prepare exports. All suggested actions require your explicit confirmation before applying!',
    },
  ]);

  const handleSendWithText = async (textToSend: string) => {
    if (!textToSend.trim() || isSending) return;

    const userText = textToSend.trim();
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setIsSending(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          currentItinerary: currentItinerary || null,
          tripMemory,
        }),
      });

      if (res.ok) {
        const data = await res.json();

        if (data.isAvailable === false) {
          setIsServiceAvailable(false);
        } else {
          setIsServiceAvailable(true);
        }

        if (data.updatedMemory) {
          setTripMemory(data.updatedMemory);
        }

        const botMsg: Message = {
          role: 'assistant',
          content: data.message || 'I have analyzed your request.',
          tripProposal: data.tripProposal || null,
          actionCommand: data.actionCommand || null,
        };

        setMessages((prev) => [...prev, botMsg]);

        if (data.updatedItinerary && onUpdateItinerary) {
          onUpdateItinerary(data.updatedItinerary);
        }

        // NOTE: Steps 67–70: Zero automatic side-effects!
        // All proposals and actions (createTripParams / actionCommand) require explicit user clicks on buttons below.
      } else {
        setIsServiceAvailable(false);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: '⚠️ AI travel chat is temporarily unavailable. Please verify your connection or try again shortly.',
          },
        ]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setIsServiceAvailable(false);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ Connection issue: Unable to reach the AI travel assistant service. Please check your network and retry.',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleApplyProposal = (msgIndex: number, proposal: TripProposal) => {
    if (onCreateTripFromChat) {
      onCreateTripFromChat(proposal);
    }
    setAppliedProposalIds((prev) => new Set(prev).add(msgIndex));
  };

  const handleActionClick = (command: 'EXPORT_PDF' | 'SAVE_TRIP' | 'EXPORT_CALENDAR') => {
    if (onExecuteActionCommand) {
      onExecuteActionCommand(command);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="px-5 py-3.5 rounded-full text-white font-bold shadow-2xl transition hover:scale-105 flex items-center gap-2.5 border-2 border-white/30 cursor-pointer"
          style={{ backgroundColor: '#263D32' }}
          aria-label="Open AI Travel Assistant"
        >
          <span className="text-xl">🤖</span>
          <span className="text-sm">AI Travel Assistant</span>
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isServiceAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
            title={isServiceAvailable ? 'AI Service Connected' : 'AI Service Unavailable'}
          />
        </button>
      ) : (
        <div className="w-80 sm:w-96 rounded-2xl shadow-2xl border bg-white overflow-hidden flex flex-col h-[540px] border-[#E1DDD1] animate-fadeIn">
          {/* Header (Step 65 & 66: Branding & Status Indicator) */}
          <div className="p-4 text-white flex justify-between items-start" style={{ backgroundColor: '#263D32' }}>
            <div className="flex items-start gap-2.5">
              <span className="text-2xl mt-0.5">🤖</span>
              <div>
                <h4 className="text-sm font-bold leading-tight">XPLORA AI Travel Assistant</h4>
                <p className="text-[11px] text-emerald-200 mt-0.5 leading-snug">
                  Planning assistant • Suggestions require your confirmation
                </p>
                <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/20 text-white/90">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isServiceAvailable ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                    }`}
                  />
                  <span>{isServiceAvailable ? 'Connected (Advisory)' : 'Service Offline / Key Unset'}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition cursor-pointer"
              aria-label="Close AI Travel Assistant"
            >
              ✕
            </button>
          </div>

          {/* Quick Prompt Suggestion Pills */}
          <div className="px-3 py-2 bg-[#F4F1E6]/70 border-b border-[#E1DDD1] flex gap-1.5 overflow-x-auto text-[11px]">
            <button
              onClick={() => handleSendWithText('Plan a 3-day family trip to Manali with budget of 25000')}
              className="px-2.5 py-1 rounded-full bg-white border border-[#526B57]/30 text-[#263D32] hover:bg-[#526B57] hover:text-white transition shrink-0 font-medium shadow-xs cursor-pointer"
            >
              🏔️ 3-Day Manali Trip
            </button>
            <button
              onClick={() => handleSendWithText('with budget of 30000')}
              className="px-2.5 py-1 rounded-full bg-white border border-[#526B57]/30 text-[#263D32] hover:bg-[#526B57] hover:text-white transition shrink-0 font-medium shadow-xs cursor-pointer"
            >
              💰 Set Budget ₹30,000
            </button>
            <button
              onClick={() => handleSendWithText('Export current itinerary to PDF')}
              className="px-2.5 py-1 rounded-full bg-white border border-[#526B57]/30 text-[#263D32] hover:bg-[#526B57] hover:text-white transition shrink-0 font-medium shadow-xs cursor-pointer"
            >
              📄 Export PDF
            </button>
            <button
              onClick={() => handleSendWithText('Save to My Trips')}
              className="px-2.5 py-1 rounded-full bg-white border border-[#526B57]/30 text-[#263D32] hover:bg-[#526B57] hover:text-white transition shrink-0 font-medium shadow-xs cursor-pointer"
            >
              💾 Save Trip
            </button>
          </div>

          {/* Chat Messages */}
          <div className="p-4 overflow-y-auto flex-1 space-y-3 bg-gray-50/50">
            {messages.map((m, idx) => {
              const isApplied = appliedProposalIds.has(idx);

              return (
                <div
                  key={idx}
                  className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[90%] p-3 rounded-2xl text-xs font-medium leading-relaxed shadow-xs ${
                      m.role === 'user'
                        ? 'bg-[#526B57] text-white rounded-br-none'
                        : 'bg-white text-[#263D32] border border-[#E1DDD1] rounded-bl-none'
                    }`}
                  >
                    <div className="whitespace-pre-line">{m.content}</div>

                    {/* Step 68: Interactive Trip Proposal Card with Explicit User Confirmation */}
                    {m.tripProposal && (
                      <div className="mt-3 p-3 rounded-xl bg-[#FAF9F5] border border-[#E1DDD1] text-xs">
                        <div className="font-bold text-[#263D32] flex items-center gap-1.5 pb-2 mb-2 border-b border-[#E1DDD1]">
                          <span>🗺️</span>
                          <span>Trip Proposal</span>
                        </div>
                        <div className="space-y-1 text-[11px] text-gray-700">
                          {m.tripProposal.destination && (
                            <div>
                              <strong className="text-[#263D32]">Destination:</strong> {m.tripProposal.destination}
                            </div>
                          )}
                          {m.tripProposal.from && (
                            <div>
                              <strong className="text-[#263D32]">Departing From:</strong> {m.tripProposal.from}
                            </div>
                          )}
                          {m.tripProposal.durationDays && (
                            <div>
                              <strong className="text-[#263D32]">Duration:</strong> {m.tripProposal.durationDays} Days
                            </div>
                          )}
                          {m.tripProposal.budget && (
                            <div>
                              <strong className="text-[#263D32]">Budget:</strong> ₹{m.tripProposal.budget.toLocaleString('en-IN')}
                            </div>
                          )}
                          {m.tripProposal.travelStyle && (
                            <div>
                              <strong className="text-[#263D32]">Travel Style:</strong> {m.tripProposal.travelStyle}
                            </div>
                          )}
                          {m.tripProposal.startDate && (
                            <div>
                              <strong className="text-[#263D32]">Date:</strong> {m.tripProposal.startDate}
                            </div>
                          )}
                        </div>

                        <div className="mt-3">
                          {isApplied ? (
                            <button
                              disabled
                              className="w-full py-2 px-3 text-xs font-bold text-white bg-emerald-600 rounded-lg shadow-xs flex items-center justify-center gap-1 cursor-default opacity-90"
                            >
                              <span>Applied to Planner ✓</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleApplyProposal(idx, m.tripProposal!)}
                              className="w-full py-2 px-3 text-xs font-bold text-white bg-[#526B57] hover:bg-[#263D32] rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <span>Apply trip details ➔</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Step 69: Explicit PDF Export Proposal Button */}
                    {m.actionCommand === 'EXPORT_PDF' && (
                      <div className="mt-3 pt-2 border-t border-[#E1DDD1]">
                        {currentItinerary ? (
                          <button
                            onClick={() => handleActionClick('EXPORT_PDF')}
                            className="w-full py-2 px-3 text-xs font-bold text-white bg-[#526B57] hover:bg-[#263D32] rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>📄 Export Itinerary to PDF</span>
                          </button>
                        ) : (
                          <div className="p-2 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                            <span>📄 <strong>PDF Export:</strong> Generate an itinerary before exporting to PDF.</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 70: Explicit Calendar & Save Proposal Buttons */}
                    {m.actionCommand === 'EXPORT_CALENDAR' && (
                      <div className="mt-3 pt-2 border-t border-[#E1DDD1]">
                        {currentItinerary ? (
                          <button
                            onClick={() => handleActionClick('EXPORT_CALENDAR')}
                            className="w-full py-2 px-3 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-[#172554] rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>📅 Export to Google Calendar</span>
                          </button>
                        ) : (
                          <div className="p-2 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                            <span>📅 <strong>Calendar Export:</strong> Generate an itinerary first to export calendar events.</span>
                          </div>
                        )}
                      </div>
                    )}

                    {m.actionCommand === 'SAVE_TRIP' && (
                      <div className="mt-3 pt-2 border-t border-[#E1DDD1]">
                        {currentItinerary ? (
                          <button
                            onClick={() => handleActionClick('SAVE_TRIP')}
                            className="w-full py-2 px-3 text-xs font-bold text-white bg-[#263D32] hover:bg-[#1B2B23] rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>💾 Save Trip to My Account</span>
                          </button>
                        ) : (
                          <div className="p-2 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                            <span>💾 <strong>Save Trip:</strong> Generate an itinerary before saving.</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {isSending && (
              <div className="flex justify-start">
                <div className="p-3 rounded-2xl bg-white border border-[#E1DDD1] text-xs text-gray-500 flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#526B57] border-t-transparent rounded-full animate-spin"></div>
                  AI Assistant formulating recommendations...
                </div>
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-[#E1DDD1] flex gap-2">
            <input
              type="text"
              placeholder="e.g. Plan 4 days in Goa with budget 30000..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendWithText(input)}
              className="flex-1 px-3 py-2 text-xs border rounded-xl focus:outline-none bg-gray-50 text-[#263D32]"
              style={{ borderColor: '#E1DDD1' }}
            />
            <button
              onClick={() => handleSendWithText(input)}
              disabled={isSending || !input.trim()}
              className="px-4 py-2 text-xs font-bold text-white rounded-xl transition shadow-md disabled:opacity-50 cursor-pointer"
              style={{ backgroundColor: '#526B57' }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
