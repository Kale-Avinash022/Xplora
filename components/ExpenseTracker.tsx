'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { convertAmount } from '@/lib/currencyUtils';
import { estimateTripCost, TripCostEstimate } from '@/lib/costEstimator';

export interface ExpenseItem {
  id: string;
  category: string;
  title: string;
  amount: number;
  timestamp: number;
}

export interface ExpenseTrackerProps {
  plannedBudget: number;
  currencyCode: string;
  destination?: string;
  dayPlans?: Array<{
    dayNumber: number;
    summary?: string;
    activities: Array<{
      title: string;
      category: string;
      cost: number;
      timeSlot?: string;
    }>;
  }>;
  from?: string;
  travelers?: number;
  travelStyle?: string;
  durationDays?: number;
}

/**
 * Creates a deterministic, collision-resistant string hash from the generated dayPlans structure.
 */
function hashDayPlans(dayPlans?: ExpenseTrackerProps['dayPlans']): string {
  if (!dayPlans || dayPlans.length === 0) return 'empty';
  try {
    const signature = dayPlans
      .map(
        (d) =>
          `d${d.dayNumber}:${(d.activities || [])
            .map((a) => `${a.title}_${a.cost}`)
            .join(';')}`
      )
      .join('|');
    let hash = 0;
    for (let i = 0; i < signature.length; i++) {
      hash = (hash << 5) - hash + signature.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  } catch {
    return 'default';
  }
}

export function ExpenseTracker({
  plannedBudget,
  currencyCode,
  destination = 'Trip',
  dayPlans = [],
  from = '',
  travelers = 2,
  travelStyle = 'Adventure',
  durationDays,
}: ExpenseTrackerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeView, setActiveView] = useState<'tracker' | 'planned_breakdown'>('tracker');
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState('Food & Dining');

  const resolvedDuration =
    durationDays && durationDays > 0
      ? durationDays
      : dayPlans && dayPlans.length > 0
      ? dayPlans.length
      : 2;

  // Compute realistic baseline estimates for this trip
  const costEstimate: TripCostEstimate = useMemo(() => {
    return estimateTripCost({
      destination,
      from,
      durationDays: resolvedDuration,
      travelers,
      travelStyle,
    });
  }, [destination, from, resolvedDuration, travelers, travelStyle]);

  const isUnderBudget = plannedBudget < costEstimate.minimumRequired;
  const budgetDeficit = costEstimate.minimumRequired - plannedBudget;

  // Build storage key scoped strictly to: xplora_expenses_<destination-slug>-d<durationDays>-<hash of dayPlans>
  const storageKey = useMemo(() => {
    const destSlug = (destination || 'trip')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const planHash = hashDayPlans(dayPlans);
    return `xplora_expenses_${destSlug}-d${resolvedDuration}-${planHash}`;
  }, [destination, resolvedDuration, dayPlans]);

  // Actual Spent starts at strictly ₹0. No fake expenses or dayPlan costs seeded.
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Read localStorage strictly inside useEffect to avoid SSR hydration mismatches
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setExpenses(parsed);
          setIsHydrated(true);
          return;
        }
      }
    } catch (err) {
      console.error('Error loading expenses from localStorage', err);
    }
    // New itinerary or empty storage: resets cleanly to empty
    setExpenses([]);
    setIsHydrated(true);
  }, [storageKey]);

  // Persist only user-logged expenses to localStorage
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(expenses));
    } catch (err) {
      console.error('Error saving expenses to localStorage', err);
    }
  }, [expenses, isHydrated, storageKey]);

  const totalSpent = useMemo(
    () => expenses.reduce((acc, item) => acc + item.amount, 0),
    [expenses]
  );
  const remaining = plannedBudget - totalSpent;
  const percentUsed =
    plannedBudget > 0 ? Math.min(100, Math.round((totalSpent / plannedBudget) * 100)) : 0;

  const handleAddExpense = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const numAmount = parseFloat(newAmount);
    if (!newTitle.trim() || isNaN(numAmount) || numAmount <= 0) return;

    const item: ExpenseItem = {
      id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      category: newCategory,
      title: newTitle.trim(),
      amount: Math.round(numAmount),
      timestamp: Date.now(),
    };

    setExpenses((prev) => [item, ...prev]);
    setNewTitle('');
    setNewAmount('');
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all logged expenses for this trip?')) {
      setExpenses([]);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-[#E1DDD1] mb-8 transition-all">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 mb-5 gap-3" style={{ borderColor: '#E1DDD1' }}>
        <div className="flex items-center gap-2.5">
          <span className="text-2xl p-2 rounded-xl bg-[#F4F1E6] border border-[#E1DDD1]">📊</span>
          <div>
            <h3 className="text-xl font-bold text-[#263D32]" style={{ fontFamily: 'Playfair Display, serif' }}>
              Real-Time Expense & Budget Tracker
            </h3>
            <p className="text-xs text-[#526B57]">
              Log actual expenses in real time for your {resolvedDuration}-day trip to {destination}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveView(activeView === 'tracker' ? 'planned_breakdown' : 'tracker')}
            className="px-3 py-2 text-xs font-semibold text-[#526B57] bg-[#F4F1E6] rounded-lg border border-[#E1DDD1] hover:bg-[#E1DDD1]/60 transition"
          >
            {activeView === 'tracker' ? '📋 View Planned Breakdown' : '💳 Back to Tracker'}
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition hover:opacity-95"
            style={{ backgroundColor: '#526B57' }}
          >
            {isOpen ? '✕ Close Form' : '✏️ Log Expense'}
          </button>
        </div>
      </div>

      {/* Realistic Budget Sanity Warning Banner */}
      {isUnderBudget && (
        <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 shadow-sm animate-fadeIn">
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0 mt-0.5">⚠️</span>
            <div className="text-xs leading-relaxed">
              <div className="font-bold text-sm text-amber-950 mb-0.5">
                Realistic Budget Advisory for {destination}
              </div>
              <p>
                Your planned budget of{' '}
                <strong className="font-bold">{convertAmount(plannedBudget, currencyCode)}</strong> is below the
                estimated realistic minimum of{' '}
                <strong className="font-bold">{convertAmount(costEstimate.minimumRequired, currencyCode)}</strong> for a{' '}
                {resolvedDuration}-day trip ({travelers} traveler{travelers > 1 ? 's' : ''}).
                Deficit: <strong className="text-red-700 font-bold">{convertAmount(budgetDeficit, currencyCode)}</strong>.
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                <span className="px-2 py-0.5 bg-white/80 rounded border border-amber-300 font-medium">
                  Recommended Budget: <strong>{convertAmount(costEstimate.recommended, currencyCode)}</strong>
                </span>
                <span className="px-2 py-0.5 bg-white/80 rounded border border-amber-300 font-medium">
                  Comfortable Tier: <strong>{convertAmount(costEstimate.comfortable, currencyCode)}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress & Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="p-4 rounded-xl bg-[#F4F1E6]/50 border border-[#E1DDD1]">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#526B57]">Planned Budget</span>
            <span className="text-[10px] font-medium text-gray-500">Trip Allocation</span>
          </div>
          <div className="text-2xl font-extrabold text-[#263D32]">
            {convertAmount(plannedBudget, currencyCode)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#F4F1E6]/50 border border-[#E1DDD1]">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#526B57]">Actual Spent</span>
            <span className="text-[10px] font-medium text-gray-500">
              {expenses.length} {expenses.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>
          <div className="text-2xl font-extrabold text-[#526B57]">
            {convertAmount(totalSpent, currencyCode)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#F4F1E6]/50 border border-[#E1DDD1]">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#526B57]">Remaining Balance</span>
            <span className="text-[10px] font-bold text-gray-500">{100 - percentUsed}% Left</span>
          </div>
          <div className={`text-2xl font-extrabold ${remaining >= 0 ? 'text-[#16a34a]' : 'text-red-600'}`}>
            {convertAmount(remaining, currencyCode)}
          </div>
        </div>
      </div>

      {/* Budget Consumption Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-[11px] font-semibold text-gray-500 mb-1.5">
          <span>Budget Spent: {percentUsed}%</span>
          <span>{convertAmount(totalSpent, currencyCode)} of {convertAmount(plannedBudget, currencyCode)}</span>
        </div>
        <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, percentUsed)}%`,
              backgroundColor: remaining >= 0 ? '#526B57' : '#ef4444',
            }}
          />
        </div>
      </div>

      {/* View 1: Planned Breakdown vs View 2: Tracker */}
      {activeView === 'planned_breakdown' ? (
        <div className="p-5 rounded-xl bg-[#F4F1E6]/40 border border-[#E1DDD1] mb-5 animate-fadeIn">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h4 className="text-sm font-bold text-[#263D32]">
                Realistic Planned Cost Breakdown (Estimates)
              </h4>
              <p className="text-[11px] text-[#526B57]">
                Benchmark 2026 rates for {destination} ({resolvedDuration} days, {travelers} traveler{travelers > 1 ? 's' : ''}). These are planned allocations, NOT logged spending.
              </p>
            </div>
            <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-[#526B57]/15 text-[#263D32] rounded-md">
              Planned Benchmarks
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            {costEstimate.breakdown.map((item) => (
              <div
                key={item.category}
                className="p-3 bg-white rounded-lg border border-[#E1DDD1] shadow-2xs flex flex-col justify-between"
              >
                <span className="text-[11px] font-bold text-[#263D32] mb-1">{item.label}</span>
                <div className="flex justify-between items-baseline text-xs mt-1">
                  <span className="text-gray-500 text-[10px]">Min: {convertAmount(item.minimum, currencyCode)}</span>
                  <span className="font-bold text-[#526B57]">Rec: {convertAmount(item.recommended, currencyCode)}</span>
                </div>
              </div>
            ))}
          </div>

          {costEstimate.assumptions.length > 0 && (
            <div className="text-[11px] text-gray-600 border-t pt-3" style={{ borderColor: '#E1DDD1' }}>
              <span className="font-bold text-[#263D32]">Estimation Assumptions: </span>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                {costEstimate.assumptions.map((assump, idx) => (
                  <li key={idx}>{assump}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}

      {/* Log Expense Drawer */}
      {isOpen && (
        <form onSubmit={handleAddExpense} className="p-4 rounded-xl bg-[#F4F1E6]/50 border border-[#E1DDD1] mb-5 animate-fadeIn">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#526B57]">
              ✏️ Log Actual Expense Item
            </h4>
            <span className="text-[11px] text-gray-500">Adds strictly to Actual Spent</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Expense title (e.g. Prasad & Darshan Pass, Dinner)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="px-3 py-2 text-xs border rounded-lg bg-white font-medium focus:outline-none focus:ring-1 focus:ring-[#526B57]"
              style={{ borderColor: '#E1DDD1', color: '#263D32' }}
              required
            />
            <input
              type="number"
              placeholder="Amount (₹ INR)"
              value={newAmount}
              min="1"
              step="1"
              onChange={(e) => setNewAmount(e.target.value)}
              className="px-3 py-2 text-xs border rounded-lg bg-white font-medium focus:outline-none focus:ring-1 focus:ring-[#526B57]"
              style={{ borderColor: '#E1DDD1', color: '#263D32' }}
              required
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="px-3 py-2 text-xs border rounded-lg bg-white font-medium focus:outline-none focus:ring-1 focus:ring-[#526B57]"
              style={{ borderColor: '#E1DDD1', color: '#263D32' }}
            >
              <option value="Food & Dining">🍽️ Food & Dining</option>
              <option value="Hotel & Lodging">🏨 Hotel & Lodging</option>
              <option value="Transport">🚆 Transport (Cab / Train / Bus)</option>
              <option value="Sightseeing & Darshan">🎟️ Sightseeing & Darshan</option>
              <option value="Shopping & Misc">🛍️ Shopping & Souvenirs</option>
              <option value="Emergency & Other">🛡️ Other / Misc</option>
            </select>
            <button
              type="submit"
              className="py-2 text-xs font-bold text-white rounded-lg shadow-sm transition hover:opacity-95"
              style={{ backgroundColor: '#526B57' }}
            >
              + Log Expense
            </button>
          </div>
        </form>
      )}

      {/* Logged Expenses Section */}
      <div className="space-y-2">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-[#263D32] uppercase tracking-wider">
            User Logged Expenses ({expenses.length})
          </span>
          {expenses.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[11px] font-semibold text-red-600 hover:text-red-800 transition"
            >
              Reset All Expenses
            </button>
          )}
        </div>

        {expenses.length === 0 ? (
          <div className="p-8 rounded-xl border border-dashed text-center bg-[#F4F1E6]/20" style={{ borderColor: '#E1DDD1' }}>
            <span className="text-2xl block mb-1">🧾</span>
            <div className="text-xs font-semibold text-[#263D32]">No expenses logged yet</div>
            <p className="text-[11px] text-gray-500 mt-1 max-w-sm mx-auto">
              Actual spent is currently ₹0. Tap <strong>&quot;✏️ Log Expense&quot;</strong> above to record receipts as you travel.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {expenses.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-[#E1DDD1] bg-white flex justify-between items-center text-xs shadow-2xs hover:border-[#526B57]/50 transition"
              >
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded bg-[#526B57]/10 text-[#526B57] font-bold text-[10px]">
                    {item.category}
                  </span>
                  <span className="font-semibold text-[#263D32]">{item.title}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[#526B57]">
                    {convertAmount(item.amount, currencyCode)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteExpense(item.id)}
                    aria-label={`Delete expense ${item.title}`}
                    className="text-gray-400 hover:text-red-600 font-bold px-1 transition"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
