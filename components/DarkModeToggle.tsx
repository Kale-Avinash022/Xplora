'use client';

import React, { useState, useEffect } from 'react';

export function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('xplora_theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('xplora_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('xplora_theme', 'light');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="px-3 py-1.5 rounded-full border transition-all duration-300 flex items-center gap-1.5 hover:scale-105 shadow-sm font-bold text-xs"
      style={{
        borderColor: isDark ? '#334155' : '#E1DDD1',
        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
        color: isDark ? '#F8FAFC' : '#263D32',
      }}
      title={isDark ? 'Switch to Day (Light) Mode' : 'Switch to Night (Dark) Mode'}
    >
      <span>{isDark ? '🌙 Night' : '☀️ Day'}</span>
    </button>
  );
}
