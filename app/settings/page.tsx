'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DarkModeToggle } from '@/components/DarkModeToggle'

// ── Types ────────────────────────────────────────────────────────────────────

type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP'
const CURRENCIES: CurrencyCode[] = ['INR', 'USD', 'EUR', 'GBP']
const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  INR: 'INR (₹)',
  USD: 'USD ($)',
  EUR: 'EUR (€)',
  GBP: 'GBP (£)',
}

const DELETE_CONFIRM_WORD = 'DELETE'

// ── Delete confirmation modal ────────────────────────────────────────────────

interface DeleteModalProps {
  onClose: () => void
  onConfirm: () => Promise<void>
  isDeleting: boolean
  deleteError: string | null
}

function DeleteModal({ onClose, onConfirm, isDeleting, deleteError }: DeleteModalProps) {
  const [confirmText, setConfirmText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const firstFocusRef = useRef<HTMLButtonElement>(null)

  // Focus input when modal opens
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 20) }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isDeleting) onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isDeleting, onClose])

  // Trap focus
  const dialogRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !dialogRef.current) return
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      )
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', trap)
    return () => window.removeEventListener('keydown', trap)
  }, [])

  const isConfirmed = confirmText === DELETE_CONFIRM_WORD

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)' }}
      onClick={(e) => { if (e.target === e.currentTarget && !isDeleting) onClose() }}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        aria-describedby="delete-modal-desc"
        className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-red-200 dark:border-red-900"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">⚠️</span>
            <h2 id="delete-modal-title"
              className="text-lg font-black text-red-700 dark:text-red-400"
              style={{ fontFamily: 'Playfair Display, serif' }}>
              Delete Account
            </h2>
          </div>
          <p id="delete-modal-desc" className="text-sm text-gray-600 dark:text-gray-400">
            This is <strong>permanent and irreversible</strong>. Your account, all saved trips, and all data will be deleted immediately. There is no undo.
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label htmlFor="delete-confirm-input"
              className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Type{' '}
              <code className="px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 font-black tracking-widest">
                {DELETE_CONFIRM_WORD}
              </code>{' '}
              to confirm:
            </label>
            <input
              id="delete-confirm-input"
              ref={inputRef}
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={isDeleting}
              autoComplete="off"
              spellCheck={false}
              className="w-full px-4 py-3 rounded-xl border font-mono font-bold tracking-widest
                focus:outline-none focus:ring-2 focus:ring-red-600 transition
                disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                borderColor: isConfirmed ? '#dc2626' : '#d1d5db',
                color: 'var(--main-text)',
                backgroundColor: 'var(--white)',
              }}
              placeholder="Type DELETE here"
            />
          </div>

          {/* Error */}
          {deleteError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs font-semibold">
              ⚠ {deleteError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3">
          <button
            ref={firstFocusRef}
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-2.5 rounded-xl border font-bold text-sm transition
              hover:bg-gray-50 dark:hover:bg-slate-700
              focus:outline-none focus:ring-2 focus:ring-gray-400
              disabled:opacity-50"
            style={{ borderColor: 'var(--soft-border)', color: 'var(--main-text)' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!isConfirmed || isDeleting}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-red-600
              hover:bg-red-700 active:bg-red-800 transition
              focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting…' : 'Yes, permanently delete my account'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main settings page ───────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter()
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [currency, setCurrency] = useState<CurrencyCode>('INR')
  const [savedNotice, setSavedNotice] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const deleteButtonRef = useRef<HTMLButtonElement>(null)

  // Check if signed in (from cookie or localStorage)
  useEffect(() => {
    const cookieMatch = document.cookie.match(/(?:^|; )xplora_user=([^;]*)/)
    const raw = cookieMatch ? decodeURIComponent(cookieMatch[1]) : localStorage.getItem('xplora_user')
    setIsSignedIn(!!raw)

    const savedCurr = localStorage.getItem('xplora_currency')
    if (savedCurr && (CURRENCIES as string[]).includes(savedCurr)) {
      setCurrency(savedCurr as CurrencyCode)
    }
  }, [])

  const handleCurrencyChange = (newCurr: CurrencyCode) => {
    setCurrency(newCurr)
    localStorage.setItem('xplora_currency', newCurr)
    setSavedNotice(`Currency set to ${CURRENCY_LABELS[newCurr]}`)
    setTimeout(() => setSavedNotice(null), 2500)
  }

  const handleDeleteConfirm = useCallback(async () => {
    setIsDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch('/api/user/delete-account', { method: 'DELETE' })
      const data: unknown = await res.json()

      if (!res.ok) {
        const msg =
          typeof data === 'object' && data !== null && 'error' in data
            ? String((data as Record<string, unknown>).error)
            : 'Deletion failed. Your account is intact.'
        setDeleteError(msg)
        return
      }

      // Clear client-side session
      localStorage.removeItem('xplora_user')
      document.cookie = 'xplora_user=; path=/; max-age=0'

      // Redirect to home
      router.replace('/')
    } catch (err) {
      console.error('delete-account error:', err)
      setDeleteError('Network error. Your account has NOT been deleted. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }, [router])

  const openDeleteModal = () => {
    setDeleteError(null)
    setShowDeleteModal(true)
  }

  const closeDeleteModal = () => {
    if (isDeleting) return
    setShowDeleteModal(false)
    setDeleteError(null)
    // Return focus to trigger button
    setTimeout(() => deleteButtonRef.current?.focus(), 10)
  }

  return (
    <div className="min-h-screen transition-colors py-12 px-4 sm:px-6 lg:px-8"
      style={{ backgroundColor: 'var(--sand-bg)' }}>
      <div className="max-w-xl mx-auto space-y-6">

        {/* Back link */}
        <div className="flex items-center justify-between">
          <Link href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 dark:text-teal-400 hover:underline focus:outline-none focus:ring-2 focus:ring-teal-700 rounded">
            ← Back to Home
          </Link>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--sage-green)' }}>
            System Preferences
          </span>
        </div>

        {/* ── Card: App Settings ───────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-[#E1DDD1] dark:border-slate-700 p-8 sm:p-10">
          <h1 className="text-2xl font-black mb-8"
            style={{ fontFamily: 'Playfair Display, serif', color: 'var(--forest-green)' }}>
            App Settings
          </h1>

          <div className="space-y-8">
            {/* Appearance */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-slate-700">
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--main-text)' }}>Appearance</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Choose between Day (light) and Night (dark) themes.
                </p>
              </div>
              <div className="self-start sm:self-auto">
                <DarkModeToggle />
              </div>
            </div>

            {/* Currency */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <label htmlFor="currency-select"
                  className="block text-sm font-bold" style={{ color: 'var(--main-text)' }}>
                  Default Currency
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Select your preferred pricing currency for estimates.
                </p>
              </div>
              <select
                id="currency-select"
                value={currency}
                onChange={(e) => handleCurrencyChange(e.target.value as CurrencyCode)}
                className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600
                  bg-gray-50 dark:bg-slate-700 font-semibold text-sm
                  focus:outline-none focus:ring-2 focus:ring-teal-700"
                style={{ color: 'var(--main-text)' }}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{CURRENCY_LABELS[c]}</option>
                ))}
              </select>
            </div>
          </div>

          {savedNotice && (
            <div className="mt-6 p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-semibold">
              ✓ {savedNotice}
            </div>
          )}
        </div>

        {/* ── Card: Preferences (placeholder) ─────────────────────────── */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-[#E1DDD1] dark:border-slate-700 p-8 sm:p-10">
          <h2 className="text-lg font-black mb-2"
            style={{ fontFamily: 'Playfair Display, serif', color: 'var(--forest-green)' }}>
            Preferences
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Coming soon</p>
        </div>

        {/* ── Card: Account (danger zone) ──────────────────────────────── */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-[#E1DDD1] dark:border-slate-700 overflow-hidden">
          <div className="px-8 sm:px-10 py-6 border-b border-gray-100 dark:border-slate-700">
            <h2 className="text-lg font-black"
              style={{ fontFamily: 'Playfair Display, serif', color: 'var(--forest-green)' }}>
              Account
            </h2>
          </div>

          {/* Danger zone */}
          <div className="px-8 sm:px-10 py-6 bg-red-50/60 dark:bg-red-950/20 border-t-2 border-dashed border-red-300 dark:border-red-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-red-700 dark:text-red-400">Delete Account</p>
                <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-0.5 max-w-xs">
                  Permanently delete your account and all saved trips. This action cannot be undone.
                </p>
              </div>
              <button
                ref={deleteButtonRef}
                type="button"
                onClick={openDeleteModal}
                disabled={!isSignedIn}
                className="shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600
                  hover:bg-red-700 active:bg-red-800 transition shadow-sm
                  focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2
                  disabled:opacity-40 disabled:cursor-not-allowed"
                title={!isSignedIn ? 'Sign in to delete your account' : undefined}
              >
                Delete my account
              </button>
            </div>
            {!isSignedIn && (
              <p className="mt-3 text-xs text-gray-400">
                You must be{' '}
                <Link href="/login" className="font-bold text-teal-700 hover:underline">
                  signed in
                </Link>{' '}
                to delete your account.
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Delete modal */}
      {showDeleteModal && (
        <DeleteModal
          onClose={closeDeleteModal}
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
          deleteError={deleteError}
        />
      )}
    </div>
  )
}
