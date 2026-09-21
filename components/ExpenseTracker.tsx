'use client';

import React, { useState, useCallback } from 'react';
import { convertAmount } from '@/lib/currencyUtils';

interface ExpenseItem {
  id: string;
  category: string;
  title: string;
  amount: number;
}

interface ExpenseTrackerProps {
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
}

export function ExpenseTracker({
  plannedBudget,
  currencyCode,
  destination = 'Trip',
  dayPlans = [],
}: ExpenseTrackerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Generate real itinerary-based initial expenses if not saved
  const storageKey = `xplora_expenses_${destination.toLowerCase().replace(/\s+/g, '_')}_${plannedBudget}`;

  const getInitialExpenses = useCallback((): ExpenseItem[] => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (err) {
        console.error('Error loading expenses from localStorage', err);
      }
    }

    // Derive real expenses from generated itinerary activities
    if (dayPlans && dayPlans.length > 0) {
      const realItems: ExpenseItem[] = [];

      dayPlans.forEach((day) => {
        day.activities.forEach((act, idx) => {
          if (act.cost && act.cost > 0) {
            realItems.push({
              id: `exp-day${day.dayNumber}-${idx}-${Date.now()}`,
              category: act.category || 'Sightseeing',
              title: `Day ${day.dayNumber}: ${act.title}`,
              amount: act.cost,
            });
          }
        });
      });

      if (realItems.length > 0) {
        return realItems;
      }
    }

    return [
      { id: `exp-init-1`, category: 'Hotel', title: `${destination} Hotel & Lodging`, amount: Math.round(plannedBudget * 0.35) },
      { id: `exp-init-2`, category: 'Sightseeing', title: `${destination} Activity Passes & Transport`, amount: Math.round(plannedBudget * 0.15) },
    ];
  }, [dayPlans, destination, plannedBudget, storageKey]);

  const [expenses, setExpenses] = useState<ExpenseItem[]>(getInitialExpenses);
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState('Food');

  // Reset or re-derive expenses when destination or dayPlans change
  React.useEffect(() => {
    setExpenses(getInitialExpenses());
  }, [getInitialExpenses]);

  // Persist to localStorage whenever expenses change
  React.useEffect(() => {
    if (typeof window !== 'undefined' && expenses.length > 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(expenses));
      } catch (err) {
        console.error('Error saving expenses', err);
      }
    }
  }, [expenses, storageKey]);

  const totalSpent = expenses.reduce((acc, item) => acc + item.amount, 0);
  const remaining = plannedBudget - totalSpent;
  const percentUsed = Math.min(100, Math.round((totalSpent / plannedBudget) * 100));

  const handleAddExpense = () => {
    if (!newTitle.trim() || !newAmount || Number(newAmount) <= 0) return;

    const item: ExpenseItem = {
      id: `exp-${Date.now()}`,
      category: newCategory,
      title: newTitle.trim(),
      amount: Number(newAmount),
    };

    setExpenses([...expenses, item]);
    setNewTitle('');
    setNewAmount('');
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter((e) => e.id !== id));
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-[#E1DDD1] mb-8">
      <div className="flex justify-between items-center border-b pb-4 mb-4" style={{ borderColor: '#E1DDD1' }}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">📊</span>
          <div>
            <h3 className="text-xl font-bold text-[#263D32]" style={{ fontFamily: 'Playfair Display, serif' }}>
              Real-Time Expense & Budget Tracker
            </h3>
            <p className="text-xs text-[#526B57]">Log actual expenses and monitor trip cashflow in real time</p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition hover:scale-105"
          style={{ backgroundColor: '#526B57' }}
        >
          {isOpen ? 'Close Logger' : '✏️ Log Expense'}
        </button>
      </div>

      {/* Progress & Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="p-3.5 rounded-xl bg-[#F4F1E6]/50 border border-[#E1DDD1]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#526B57]">Planned Budget</span>
          <div className="text-xl font-extrabold text-[#263D32]">{convertAmount(plannedBudget, currencyCode)}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#F4F1E6]/50 border border-[#E1DDD1]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#526B57]">Actual Spent</span>
          <div className="text-xl font-extrabold text-[#526B57]">{convertAmount(totalSpent, currencyCode)}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#F4F1E6]/50 border border-[#E1DDD1]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#526B57]">Remaining Balance</span>
          <div className={`text-xl font-extrabold ${remaining >= 0 ? 'text-[#16a34a]' : 'text-red-600'}`}>
            {convertAmount(remaining, currencyCode)}
          </div>
        </div>
      </div>

      <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden mb-4">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentUsed}%`,
            backgroundColor: remaining >= 0 ? '#526B57' : '#ef4444',
          }}
        />
      </div>

      {/* Add Expense Drawer */}
      {isOpen && (
        <div className="p-4 rounded-xl bg-[#F4F1E6]/40 border border-[#E1DDD1] mb-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#526B57] mb-3">Add New Expense Item</h4>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Expense title (e.g. Dinner at Beach Shack)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="px-3 py-2 text-xs border rounded-lg bg-white"
              style={{ borderColor: '#E1DDD1' }}
            />
            <input
              type="number"
              placeholder="Amount (₹ INR)"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              className="px-3 py-2 text-xs border rounded-lg bg-white"
              style={{ borderColor: '#E1DDD1' }}
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="px-3 py-2 text-xs border rounded-lg bg-white"
              style={{ borderColor: '#E1DDD1' }}
            >
              <option value="Food">🍽️ Food & Dining</option>
              <option value="Hotel">🏨 Accommodation</option>
              <option value="Flight">✈️ Transport</option>
              <option value="Sightseeing">🎟️ Sightseeing & Activities</option>
              <option value="Shopping">🛍️ Shopping & Misc</option>
            </select>
            <button
              onClick={handleAddExpense}
              className="py-2 text-xs font-bold text-white rounded-lg shadow-sm transition"
              style={{ backgroundColor: '#526B57' }}
            >
              + Add Expense
            </button>
          </div>
        </div>
      )}

      {/* Expense List */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {expenses.map((item) => (
          <div
            key={item.id}
            className="p-3 rounded-xl border border-[#E1DDD1] bg-white flex justify-between items-center text-xs"
          >
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#526B57]/10 text-[#526B57] font-bold text-[10px]">
                {item.category}
              </span>
              <span className="font-semibold text-[#263D32]">{item.title}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-[#526B57]">{convertAmount(item.amount, currencyCode)}</span>
              <button
                onClick={() => handleDeleteExpense(item.id)}
                className="text-red-500 hover:text-red-700 font-bold"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
