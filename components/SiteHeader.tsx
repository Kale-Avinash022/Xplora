'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { DarkModeToggle } from '@/components/DarkModeToggle'
import { UserMenu } from '@/components/UserMenu'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CurrentUser {
  id: string
  name: string
  email: string
  image?: string | null
}

interface SiteHeaderProps {
  currentUser: CurrentUser | null
  onLogout: () => void
  onMyTrips: () => void
}

// ─── Supported languages ──────────────────────────────────────────────────────

type LangCode = 'en' | 'hi' | 'mr'
interface Language {
  code: LangCode
  label: string
  native: string
}
const LANGUAGES: Language[] = [
  { code: 'en', label: 'English',  native: 'English' },
  { code: 'hi', label: 'Hindi',    native: 'हिन्दी' },
  { code: 'mr', label: 'Marathi',  native: 'मराठी' },
]

function getCookieLang(): LangCode {
  if (typeof document === 'undefined') return 'en'
  const match = document.cookie.match(/(?:^|; )xplora_lang=([^;]*)/)
  const val = match ? decodeURIComponent(match[1]) : ''
  return (LANGUAGES.some((l) => l.code === val) ? val : 'en') as LangCode
}

function setCookieLang(code: LangCode) {
  document.cookie = `xplora_lang=${encodeURIComponent(code)}; path=/; max-age=${60 * 60 * 24 * 365}`
}

// ─── Globe SVG ───────────────────────────────────────────────────────────────

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M12 2a10 10 0 100 20A10 10 0 0012 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M2 12h20M12 2c-2.8 3-4.5 6.3-4.5 10S9.2 19 12 22c2.8-3 4.5-6.3 4.5-10S14.8 5 12 2z" />
    </svg>
  )
}

// ─── Heart / Wishlist SVG ────────────────────────────────────────────────────

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  )
}

// ─── Hamburger SVG ───────────────────────────────────────────────────────────

function HamburgerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

// ─── Language Switcher ───────────────────────────────────────────────────────

function LanguageSwitcher() {
  const [lang, setLang] = useState<LangCode>('en')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const itemsRef = useRef<(HTMLButtonElement | null)[]>([])

  // Hydrate from cookie after mount
  useEffect(() => { setLang(getCookieLang()) }, [])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Escape closes, arrow keys navigate
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return
    const items = itemsRef.current.filter((x): x is HTMLButtonElement => x !== null)
    const idx = items.indexOf(document.activeElement as HTMLButtonElement)
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); triggerRef.current?.focus() }
    else if (e.key === 'ArrowDown') { e.preventDefault(); items[(idx + 1) % items.length]?.focus() }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); items[(idx - 1 + items.length) % items.length]?.focus() }
  }

  // Focus first item when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => itemsRef.current.find(Boolean)?.focus(), 10)
    } else {
      // focus restored via trigger
    }
  }, [open])

  const selectLang = (code: LangCode) => {
    setLang(code)
    setCookieLang(code)
    setOpen(false)
    triggerRef.current?.focus()
  }

  const currentLang = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0]

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${currentLang.label}`}
        className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium
          hover:bg-[#F4F1E6] dark:hover:bg-slate-700 transition
          focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-1"
        style={{ color: 'var(--forest-green)' }}
      >
        <GlobeIcon className="w-5 h-5" />
        <span className="hidden sm:inline text-xs font-bold">{currentLang.code.toUpperCase()}</span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Select language"
          className="absolute right-0 mt-2 w-40 rounded-xl bg-white dark:bg-slate-800 shadow-xl
            border border-gray-100 dark:border-slate-700 z-50 py-1 overflow-hidden"
        >
          {LANGUAGES.map((l, i) => (
            <button
              key={l.code}
              type="button"
              role="option"
              aria-selected={lang === l.code}
              ref={(el) => { itemsRef.current[i] = el }}
              onClick={() => selectLang(l.code)}
              className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm
                hover:bg-teal-50 dark:hover:bg-slate-700 transition
                focus:outline-none focus:bg-teal-50 dark:focus:bg-slate-700"
              style={{ color: 'var(--main-text)' }}
            >
              <span>{l.native}</span>
              {lang === l.code && (
                <svg className="w-4 h-4 text-teal-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Mobile Drawer ───────────────────────────────────────────────────────────

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
  onMyTrips: () => void
  pathname: string
}

function MobileDrawer({ isOpen, onClose, onMyTrips, pathname }: MobileDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)
  const closeRef  = useRef<HTMLButtonElement>(null)

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [isOpen, onClose])

  // Focus the close button when drawer opens
  useEffect(() => {
    if (isOpen) setTimeout(() => closeRef.current?.focus(), 10)
  }, [isOpen])

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const navLinks = [
    { href: '/discover',  label: '🧭 Discover' },
    { href: '/wishlist',  label: '❤️ Wishlist' },
    { href: '/offers',    label: '🏷️ Offers' },
  ]

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className="fixed inset-y-0 right-0 z-50 w-72 max-w-[calc(100vw-3rem)] bg-white dark:bg-slate-800
          shadow-2xl flex flex-col"
        style={{ borderLeft: '1px solid var(--soft-border)' }}
      >
        {/* Drawer header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--soft-border)' }}
        >
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-teal-700 rounded"
          >
            <img src="/logo.png" alt="XPLORA" className="h-9 w-9 rounded-full object-cover" />
            <span className="font-black text-base" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--forest-green)' }}>
              XPLORA
            </span>
          </Link>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-700
              focus:outline-none focus:ring-2 focus:ring-teal-700 transition"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {navLinks.map(({ href, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition
                  focus:outline-none focus:ring-2 focus:ring-teal-700
                  ${active
                    ? 'bg-teal-700 text-white'
                    : 'hover:bg-[#F4F1E6] dark:hover:bg-slate-700'}`}
                style={active ? {} : { color: 'var(--main-text)' }}
              >
                {label}
              </Link>
            )
          })}

          <button
            type="button"
            onClick={() => { onClose(); onMyTrips() }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition
              hover:bg-[#F4F1E6] dark:hover:bg-slate-700
              focus:outline-none focus:ring-2 focus:ring-teal-700"
            style={{ color: 'var(--main-text)' }}
          >
            🧳 My Trips
          </button>
        </nav>

        {/* Bottom tools */}
        <div
          className="flex items-center gap-3 px-5 py-4 border-t"
          style={{ borderColor: 'var(--soft-border)' }}
        >
          <LanguageSwitcher />
          <DarkModeToggle />
        </div>
      </div>
    </>
  )
}

// ─── Main SiteHeader Component ────────────────────────────────────────────────

export function SiteHeader({ currentUser, onLogout, onMyTrips }: SiteHeaderProps) {
  const pathname  = usePathname()
  const router    = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false) }, [pathname])

  // Keyboard shortcut: close drawer on navigation
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  const navLinks = [
    { href: '/',         label: 'Home' },
    { href: '/discover', label: 'Discover' },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <>
      <header
        className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-sm sticky top-0 z-30"
        style={{ borderBottom: '2px solid var(--soft-border)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* ── Left: Logo + Nav links ────────────────────────────────── */}
            <div className="flex items-center gap-6">
              {/* Logo */}
              <Link
                href="/"
                className="flex items-center gap-2.5 shrink-0
                  focus:outline-none focus:ring-2 focus:ring-teal-700 rounded-lg"
                aria-label="Xplora — home"
              >
                <img
                  src="/logo.png"
                  alt=""
                  aria-hidden="true"
                  className="h-10 w-10 rounded-full object-cover shadow-sm"
                />
                <span
                  className="hidden sm:block font-black text-lg tracking-tight"
                  style={{ fontFamily: 'Playfair Display, serif', color: 'var(--forest-green)' }}
                >
                  XPLORA
                </span>
              </Link>

              {/* Desktop nav links — hidden on mobile */}
              <nav className="hidden md:flex items-center gap-1" aria-label="Primary navigation">
                {navLinks.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition
                      focus:outline-none focus:ring-2 focus:ring-teal-700
                      ${isActive(href)
                        ? 'bg-teal-700 text-white'
                        : 'hover:bg-[#F4F1E6] dark:hover:bg-slate-700'}`}
                    style={isActive(href) ? {} : { color: 'var(--forest-green)' }}
                    aria-current={isActive(href) ? 'page' : undefined}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* ── Right: actions ───────────────────────────────────────── */}
            <div className="flex items-center gap-1 sm:gap-2">

              {/* Wishlist — desktop only */}
              <Link
                href="/wishlist"
                aria-label="Wishlist"
                className="hidden md:flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium
                  hover:bg-[#F4F1E6] dark:hover:bg-slate-700 transition
                  focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-1"
                style={{ color: 'var(--forest-green)' }}
              >
                <HeartIcon className="w-5 h-5" />
                <span className="hidden lg:inline text-xs font-bold">Wishlist</span>
              </Link>

              {/* Offers link — desktop only */}
              <Link
                href="/offers"
                aria-label="Best deals and offers"
                className={`hidden md:flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium
                  transition focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-1
                  ${isActive('/offers')
                    ? 'bg-teal-700 text-white'
                    : 'hover:bg-[#F4F1E6] dark:hover:bg-slate-700'}`}
                style={isActive('/offers') ? {} : { color: 'var(--forest-green)' }}
              >
                <span className="text-base" aria-hidden="true">🏷️</span>
                <span className="hidden lg:inline text-xs font-bold">Offers</span>
              </Link>

              {/* Language switcher — desktop only */}
              <div className="hidden md:block">
                <LanguageSwitcher />
              </div>

              {/* Dark mode toggle — desktop only */}
              <div className="hidden md:block">
                <DarkModeToggle />
              </div>

              {/* Auth / Avatar ───────────────────────────────────────── */}
              {currentUser ? (
                <UserMenu
                  user={{
                    name: currentUser.name,
                    email: currentUser.email,
                    image: currentUser.image ?? null,
                  }}
                  onLogout={onLogout}
                  onMyTrips={onMyTrips}
                />
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-semibold rounded-lg border transition
                      hover:bg-[#F4F1E6] dark:hover:bg-slate-700
                      focus:outline-none focus:ring-2 focus:ring-teal-700"
                    style={{ borderColor: 'var(--soft-border)', color: 'var(--forest-green)' }}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition
                      bg-[#526B57] hover:bg-[#263D32]
                      focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-1"
                  >
                    Sign up
                  </Link>
                </div>
              )}

              {/* Mobile: signed-out shows Sign in; signed-in handled by UserMenu above */}
              {!currentUser && (
                <Link
                  href="/login"
                  className="md:hidden px-3 py-1.5 text-xs font-bold text-white rounded-lg
                    bg-[#526B57] hover:bg-[#263D32] transition
                    focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-1"
                >
                  Sign in
                </Link>
              )}

              {/* Hamburger — mobile only */}
              <button
                type="button"
                onClick={() => setDrawerOpen((p) => !p)}
                aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={drawerOpen}
                aria-controls="mobile-nav-drawer"
                className="md:hidden p-2 rounded-lg transition
                  hover:bg-[#F4F1E6] dark:hover:bg-slate-700
                  focus:outline-none focus:ring-2 focus:ring-teal-700"
                style={{ color: 'var(--forest-green)' }}
              >
                {drawerOpen ? <CloseIcon className="w-5 h-5" /> : <HamburgerIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer — rendered in a portal-like fashion below header */}
      <div id="mobile-nav-drawer">
        <MobileDrawer
          isOpen={drawerOpen}
          onClose={closeDrawer}
          onMyTrips={onMyTrips}
          pathname={pathname}
        />
      </div>
    </>
  )
}
