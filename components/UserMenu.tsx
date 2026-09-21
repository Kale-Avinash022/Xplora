'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface UserMenuProps {
  user: {
    name: string;
    email?: string;
    image?: string | null;
  };
  onLogout: () => void;
  onMyTrips?: () => void;
}

export function UserMenu({ user, onLogout, onMyTrips }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>(user.image || '/default-avatar.svg');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuItemsRef = useRef<(HTMLAnchorElement | HTMLButtonElement | null)[]>([]);

  // Keep imgSrc updated if user.image changes
  useEffect(() => {
    setImgSrc(user.image || '/default-avatar.svg');
  }, [user.image]);

  // Close on route change
  const pathname = usePathname();
  useEffect(() => { setIsOpen(false); }, [pathname]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle Tab or Escape key inside menu
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
      return;
    }

    const items = menuItemsRef.current.filter(Boolean) as (HTMLAnchorElement | HTMLButtonElement)[];
    const currentIndex = items.indexOf(document.activeElement as HTMLAnchorElement | HTMLButtonElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = currentIndex === -1 || currentIndex === items.length - 1 ? 0 : currentIndex + 1;
      items[nextIndex]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = currentIndex === -1 || currentIndex === 0 ? items.length - 1 : currentIndex - 1;
      items[prevIndex]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      items[items.length - 1]?.focus();
    } else if (e.key === 'Tab') {
      // If user tabs away from the menu, close it
      setIsOpen(false);
    }
  };

  return (
    <div className="relative inline-block text-left" onKeyDown={handleKeyDown}>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open profile menu"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="w-10 h-10 rounded-full ring-2 ring-teal-700 hover:ring-[3px] focus:outline-none focus:ring-4 focus:ring-teal-700/50 transition-all flex items-center justify-center overflow-hidden bg-teal-50 shrink-0"
      >
        <img
          src={imgSrc}
          alt={user.name || 'User profile'}
          onError={() => setImgSrc('/default-avatar.svg')}
          className="w-full h-full object-cover"
        />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white dark:bg-[#1E293B] rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 z-50 py-2 focus:outline-none overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        >
          {/* 1. Header block */}
          <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-100 dark:border-slate-700">
            <div className="w-12 h-12 rounded-full ring-2 ring-teal-700 overflow-hidden shrink-0 bg-teal-50">
              <img
                src={imgSrc}
                alt={user.name || 'User profile'}
                onError={() => setImgSrc('/default-avatar.svg')}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {user.name}
              </p>
              {user.email && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
              )}
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {/* 2. My Trips */}
            <button
              type="button"
              role="menuitem"
              ref={(el) => { menuItemsRef.current[0] = el; }}
              onClick={() => { setIsOpen(false); onMyTrips?.(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-teal-50 dark:hover:bg-slate-700 hover:text-teal-800 transition focus:outline-none focus:bg-teal-50 focus:text-teal-800 dark:focus:bg-slate-700"
            >
              <svg className="w-4 h-4 text-teal-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>My Trips</span>
            </button>

            {/* 3. Profile */}
            <Link
              href="/profile"
              role="menuitem"
              ref={(el) => { menuItemsRef.current[1] = el; }}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-teal-50 dark:hover:bg-slate-700 hover:text-teal-800 transition focus:outline-none focus:bg-teal-50 focus:text-teal-800 dark:focus:bg-slate-700"
            >
              <svg className="w-4 h-4 text-teal-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Profile</span>
            </Link>

            {/* 4. Settings */}
            <Link
              href="/settings"
              role="menuitem"
              ref={(el) => { menuItemsRef.current[2] = el; }}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-teal-50 dark:hover:bg-slate-700 hover:text-teal-800 transition focus:outline-none focus:bg-teal-50 focus:text-teal-800 dark:focus:bg-slate-700"
            >
              <svg className="w-4 h-4 text-teal-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Settings</span>
            </Link>
          </div>

          {/* 5. Divider */}
          <div className="border-t border-gray-100 dark:border-slate-700 my-1" />

          {/* 6. Logout */}
          <div className="py-1">
            <button
              type="button"
              role="menuitem"
              ref={(el) => { menuItemsRef.current[3] = el; }}
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition focus:outline-none focus:bg-red-50 dark:focus:bg-red-950/30"
            >
              <svg className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
