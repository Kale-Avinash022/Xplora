'use client';

import React, { useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  createTripParams?: {
    destination: string;
    from: string;
    durationDays: number;
    budget?: number;
    travelStyle: string;
    startDate: string;
  } | null;
}

interface AIChatDrawerProps {
  currentItinerary?: any;
  onUpdateItinerary?: (updatedPlan: any) => void;
  onCreateTripFromChat?: (params: {
    destination: string;
    from: string;
    durationDays: number;
    budget?: number;
    travelStyle: string;
    startDate: string;
  }) => void;
  onExecuteActionCommand?: (command: 'EXPORT_PDF' | 'SAVE_TRIP' | 'EXPORT_CALENDAR') => void;
}

export function AIChatDrawer({
  currentItinerary,
  onUpdateItinerary,
  onCreateTripFromChat,
  onExecuteActionCommand,
}: AIChatDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [tripMemory, setTripMemory] = useState<any>({});
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '👋 Hi! I am your XPLORA AI Travel Assistant. Ask me to plan trips, update budgets (e.g. "with budget of 30000"), export to PDF, or save your trip!',
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
          messages: newMessages,
          currentItinerary: currentItinerary || null,
          tripMemory,
        }),
      });

      if (res.ok) {
        const data = await res.json();

        if (data.updatedMemory) {
          setTripMemory(data.updatedMemory);
        }

        const botMsg: Message = {
          role: 'assistant',
          content: data.message,
          createTripParams: data.createTripParams || null,
        };

        setMessages((prev) => [...prev, botMsg]);

        if (data.updatedItinerary && onUpdateItinerary) {
          onUpdateItinerary(data.updatedItinerary);
        }

        // Auto trigger trip creation & booking search if parameters extracted
        if (data.createTripParams && onCreateTripFromChat) {
          onCreateTripFromChat(data.createTripParams);
        }

        // Auto trigger autonomous actions (PDF, Save, Calendar)
        if (data.actionCommand && onExecuteActionCommand) {
          onExecuteActionCommand(data.actionCommand);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: '🤖 I noted your request! How else can I assist your trip?' },
        ]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '🤖 Connection notice: I am ready to assist your travel planning!' },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="px-5 py-3.5 rounded-full text-white font-bold shadow-2xl transition hover:scale-105 flex items-center gap-2 border-2 border-white/30"
          style={{ backgroundColor: '#263D32' }}
        >
          <span className="text-xl">🤖</span>
          <span className="text-sm">AI Travel Assistant</span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a] animate-pulse"></span>
        </button>
      ) : (
        <div className="w-80 sm:w-96 rounded-2xl shadow-2xl border bg-white overflow-hidden flex flex-col h-[500px] border-[#E1DDD1] animate-fadeIn">
          {/* Header */}
          <div className="p-4 text-white flex justify-between items-center" style={{ backgroundColor: '#263D32' }}>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              <div>
                <h4 className="text-sm font-bold">XPLORA AI Travel Assistant</h4>
                <p className="text-[11px] text-white/80">Autonomous trip planner & memory agent</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition"
            >
              ✕
            </button>
          </div>

          {/* Quick Prompt Suggestion Pills */}
          <div className="px-3 py-2 bg-[#F4F1E6]/70 border-b border-[#E1DDD1] flex gap-1.5 overflow-x-auto text-[11px]">
            <button
              onClick={() => handleSendWithText('with budget of 30000')}
              className="px-2.5 py-1 rounded-full bg-white border border-[#526B57]/30 text-[#263D32] hover:bg-[#526B57] hover:text-white transition shrink-0 font-medium shadow-xs"
            >
              💰 Set Budget ₹30,000
            </button>
            <button
              onClick={() => handleSendWithText('Export PDF')}
              className="px-2.5 py-1 rounded-full bg-white border border-[#526B57]/30 text-[#263D32] hover:bg-[#526B57] hover:text-white transition shrink-0 font-medium shadow-xs"
            >
              📄 Export PDF
            </button>
            <button
              onClick={() => handleSendWithText('Save to My Trips')}
              className="px-2.5 py-1 rounded-full bg-white border border-[#526B57]/30 text-[#263D32] hover:bg-[#526B57] hover:text-white transition shrink-0 font-medium shadow-xs"
            >
              💾 Save Trip
            </button>
          </div>

          {/* Chat Messages */}
          <div className="p-4 overflow-y-auto flex-1 space-y-3 bg-gray-50/50">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] p-3 rounded-2xl text-xs font-medium leading-relaxed shadow-xs ${m.role === 'user'
                      ? 'bg-[#526B57] text-white rounded-br-none'
                      : 'bg-white text-[#263D32] border border-[#E1DDD1] rounded-bl-none'
                    }`}
                >
                  <div className="whitespace-pre-line">{m.content}</div>

                  {/* Interactive Action Button for Extracted Trip */}
                  {m.createTripParams && (
                    <button
                      onClick={() => {
                        if (onCreateTripFromChat && m.createTripParams) {
                          onCreateTripFromChat(m.createTripParams);
                        }
                      }}
                      className="mt-3 w-full py-2 px-3 text-xs font-bold text-white bg-[#526B57] hover:bg-[#263D32] rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                    >
                      🚀 Update & Generate {m.createTripParams.destination} Plan ➔
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div className="p-3 rounded-2xl bg-white border border-[#E1DDD1] text-xs text-gray-500 flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#526B57] border-t-transparent rounded-full animate-spin"></div>
                  AI Assistant processing memory & options...
                </div>
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-[#E1DDD1] flex gap-2">
            <input
              type="text"
              placeholder="e.g. with budget of 30000, Export PDF, Save trip..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendWithText(input)}
              className="flex-1 px-3 py-2 text-xs border rounded-xl focus:outline-none bg-gray-50 text-[#263D32]"
              style={{ borderColor: '#E1DDD1' }}
            />
            <button
              onClick={() => handleSendWithText(input)}
              disabled={isSending || !input.trim()}
              className="px-4 py-2 text-xs font-bold text-white rounded-xl transition shadow-md disabled:opacity-50"
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
