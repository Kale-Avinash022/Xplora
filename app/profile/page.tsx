'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface StoredUser {
  id: string
  name: string
  email: string
  image?: string | null
  createdAt?: string
}

function getLocalUser(): StoredUser | null {
  if (typeof window === 'undefined') return null
  try {
    const cookieMatch = document.cookie.match(/(?:^|; )xplora_user=([^;]*)/)
    const raw = cookieMatch ? decodeURIComponent(cookieMatch[1]) : localStorage.getItem('xplora_user')
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'id' in parsed &&
      'name' in parsed &&
      'email' in parsed &&
      typeof (parsed as Record<string, unknown>).id === 'string' &&
      typeof (parsed as Record<string, unknown>).name === 'string' &&
      typeof (parsed as Record<string, unknown>).email === 'string'
    ) {
      return parsed as StoredUser
    }
    return null
  } catch {
    return null
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

/**
 * Resizes and center-crops an image file to a 256x256 square using the browser Canvas API.
 * Exports as WebP (falls back to JPEG if unsupported) targeting under 200 KB.
 */
async function processImage(file: File): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const size = 256
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable'))
        return
      }

      // Center-crop mathematics
      const minDim = Math.min(img.width, img.height)
      const sx = (img.width - minDim) / 2
      const sy = (img.height - minDim) / 2

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size)

      // Try webp first
      canvas.toBlob(
        (blob) => {
          if (blob && blob.type === 'image/webp') {
            const dataUrl = canvas.toDataURL('image/webp', 0.85)
            resolve({ blob, dataUrl })
          } else {
            // Fallback to JPEG
            canvas.toBlob(
              (jpegBlob) => {
                if (jpegBlob) {
                  const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
                  resolve({ blob: jpegBlob, dataUrl })
                } else {
                  reject(new Error('Failed to create image blob'))
                }
              },
              'image/jpeg',
              0.85
            )
          }
        },
        'image/webp',
        0.85
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image for processing'))
    }

    img.src = objectUrl
  })
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<StoredUser | null>(null)
  const [nameInput, setNameInput] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Avatar state
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string>('/default-avatar.svg')
  const [pendingFile, setPendingFile] = useState<Blob | null>(null)
  const [pendingPreview, setPendingPreview] = useState<string | null>(null)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false)
  const [avatarMsg, setAvatarMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const local = getLocalUser()
    if (!local) {
      router.replace('/login')
      return
    }
    setUser(local)
    setNameInput(local.name)
    if (local.image) {
      setCurrentAvatarUrl(local.image)
    }

    // Refresh from server to ensure database source of truth
    fetch('/api/user/me')
      .then((res) => {
        if (res.ok) return res.json()
        return null
      })
      .then((data) => {
        if (data?.user) {
          setUser(data.user)
          setNameInput(data.user.name)
          if (data.user.image) {
            setCurrentAvatarUrl(data.user.image)
          } else {
            setCurrentAvatarUrl('/default-avatar.svg')
          }
          localStorage.setItem('xplora_user', JSON.stringify(data.user))
        }
      })
      .catch((err) => console.error('Failed to load user info:', err))
  }, [router])

  useEffect(() => {
    if (isEditing) nameInputRef.current?.focus()
  }, [isEditing])

  // File selection handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarMsg(null)
    const file = e.target.files?.[0]
    // Always reset input value so choosing the same file twice triggers onChange
    e.target.value = ''

    if (!file) return

    // Client validation 1: file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!validTypes.includes(file.type.toLowerCase())) {
      setAvatarMsg({
        type: 'error',
        text: 'Unsupported format. Please select a PNG, JPG, or WebP image.',
      })
      return
    }

    // Client validation 2: file size (max 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      setAvatarMsg({
        type: 'error',
        text: 'File is too large. Maximum allowed size is 5 MB.',
      })
      return
    }

    try {
      // Resize & center-crop to 256x256 WebP / JPEG under 200 KB
      const { blob, dataUrl } = await processImage(file)
      setPendingFile(blob)
      setPendingPreview(dataUrl)
    } catch (err) {
      console.error('Image processing error:', err)
      setAvatarMsg({
        type: 'error',
        text: 'Could not process the selected image. Please try another one.',
      })
    }
  }

  // Save new photo
  const handleSavePhoto = async () => {
    if (!pendingFile) return
    setIsUploadingPhoto(true)
    setAvatarMsg(null)

    try {
      const formData = new FormData()
      formData.append('avatar', pendingFile, 'avatar.webp')

      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      })

      const data: unknown = await res.json()

      if (!res.ok) {
        let msg = 'Failed to upload photo.'
        if (res.status === 413) {
          msg = 'Photo is too large (exceeds 512 KB limit).'
        } else if (res.status === 415) {
          msg = 'Unsupported file type. Only JPEG, PNG, and WebP are allowed.'
        } else if (res.status === 429) {
          msg = 'Too many upload attempts. Please wait a minute and try again.'
        } else if (typeof data === 'object' && data !== null && 'error' in data) {
          msg = String((data as Record<string, unknown>).error)
        }
        // Do NOT clear the preview on failure so the user does not lose their selection
        setAvatarMsg({ type: 'error', text: msg })
        return
      }

      if (
        typeof data === 'object' &&
        data !== null &&
        'image' in data &&
        typeof (data as Record<string, unknown>).image === 'string'
      ) {
        const newImageUrl = (data as { image: string }).image
        setCurrentAvatarUrl(newImageUrl)
        setPendingFile(null)
        setPendingPreview(null)

        // Update local session
        const updatedUser = { ...user!, image: newImageUrl }
        setUser(updatedUser)
        localStorage.setItem('xplora_user', JSON.stringify(updatedUser))

        setAvatarMsg({ type: 'success', text: 'Photo updated' })
        setTimeout(() => setAvatarMsg(null), 3500)
        router.refresh()
      }
    } catch (err) {
      console.error('Avatar upload network error:', err)
      setAvatarMsg({ type: 'error', text: 'Network failure. Please check your connection and try again.' })
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  // Cancel pending photo
  const handleCancelPhoto = () => {
    setPendingFile(null)
    setPendingPreview(null)
    setAvatarMsg(null)
  }

  // Remove existing photo
  const handleRemovePhoto = async () => {
    if (!window.confirm('Are you sure you want to remove your profile photo?')) return
    setIsDeletingPhoto(true)
    setAvatarMsg(null)

    try {
      const res = await fetch('/api/profile/avatar', { method: 'DELETE' })
      if (!res.ok) {
        setAvatarMsg({ type: 'error', text: 'Failed to remove photo. Please try again.' })
        return
      }

      setCurrentAvatarUrl('/default-avatar.svg')
      setPendingFile(null)
      setPendingPreview(null)

      const updatedUser = { ...user!, image: null }
      setUser(updatedUser)
      localStorage.setItem('xplora_user', JSON.stringify(updatedUser))

      setAvatarMsg({ type: 'success', text: 'Profile photo removed.' })
      setTimeout(() => setAvatarMsg(null), 3000)
      router.refresh()
    } catch (err) {
      console.error('Avatar delete network error:', err)
      setAvatarMsg({ type: 'error', text: 'Network failure while removing photo.' })
    } finally {
      setIsDeletingPhoto(false)
    }
  }

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nameInput.trim()) return
    setIsSaving(true)
    setSaveMsg(null)

    try {
      const res = await fetch('/api/user/update-name', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameInput.trim() }),
      })
      const data: unknown = await res.json()

      if (!res.ok) {
        const errorText =
          typeof data === 'object' && data !== null && 'error' in data
            ? String((data as Record<string, unknown>).error)
            : 'Failed to save name.'
        setSaveMsg({ type: 'error', text: errorText })
        return
      }

      if (
        typeof data === 'object' &&
        data !== null &&
        'user' in data &&
        typeof (data as Record<string, unknown>).user === 'object'
      ) {
        const updated = (data as { user: StoredUser }).user
        setUser((prev) => ({ ...prev!, name: updated.name }))
        setNameInput(updated.name)
        const stored = getLocalUser()
        if (stored) localStorage.setItem('xplora_user', JSON.stringify({ ...stored, name: updated.name }))
      }

      setSaveMsg({ type: 'success', text: 'Name updated successfully!' })
      setIsEditing(false)
      setTimeout(() => setSaveMsg(null), 3500)
      router.refresh()
    } catch (err) {
      console.error('update-name error:', err)
      setSaveMsg({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setNameInput(user?.name ?? '')
    setIsEditing(false)
    setSaveMsg(null)
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--sand-bg)' }}>
        <p className="text-sm font-medium" style={{ color: 'var(--sage-green)' }}>Loading profile…</p>
      </div>
    )
  }

  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const displayedAvatar = pendingPreview || currentAvatarUrl
  const hasCustomPhoto = !!user.image && user.image !== '/default-avatar.svg'

  return (
    <div className="min-h-screen transition-colors py-12 px-4 sm:px-6 lg:px-8"
      style={{ backgroundColor: 'var(--sand-bg)' }}>
      <div className="max-w-xl mx-auto">

        {/* Back link */}
        <div className="mb-6 flex items-center justify-between">
          <Link href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 dark:text-teal-400 hover:underline focus:outline-none focus:ring-2 focus:ring-teal-700 rounded">
            ← Back to Home
          </Link>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--sage-green)' }}>
            Account Management
          </span>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-[#E1DDD1] dark:border-slate-700 p-8 sm:p-10">
          <h1 className="text-2xl font-black mb-8"
            style={{ fontFamily: 'Playfair Display, serif', color: 'var(--forest-green)' }}>
            Your Profile
          </h1>

          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-8 border-b border-gray-100 dark:border-slate-700 mb-8">
            <div className="relative group">
              {/* Avatar Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Upload profile photo"
                className="w-28 h-28 rounded-full ring-4 ring-teal-700 hover:ring-[5px] focus:outline-none focus:ring-4 focus:ring-teal-700/60 overflow-hidden shrink-0 bg-teal-50 dark:bg-slate-700 shadow-md flex items-center justify-center transition-all cursor-pointer relative"
              >
                {displayedAvatar !== '/default-avatar.svg' ? (
                  <img
                    src={displayedAvatar}
                    alt={user.name}
                    onError={() => setCurrentAvatarUrl('/default-avatar.svg')}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-black text-teal-700 select-none">{initials}</span>
                )}

                {/* Edit badge overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                  <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-[10px] font-bold tracking-wide uppercase">Edit</span>
                </div>
              </button>

              {/* Small camera badge in bottom corner */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-teal-700 text-white shadow-md flex items-center justify-center cursor-pointer hover:bg-teal-800 transition"
                title="Change photo"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>

            <div className="text-center sm:text-left flex-1">
              <h2 className="text-lg font-bold" style={{ color: 'var(--main-text)' }}>{user.name}</h2>
              <p className="text-sm mt-0.5" style={{ color: 'var(--sage-green)' }}>{user.email}</p>
              {user.createdAt && (
                <p className="text-xs mt-1 text-gray-400">
                  Member since {formatDate(user.createdAt)}
                </p>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileSelect}
                className="hidden"
                aria-label="Upload profile photo"
              />

              {/* Action Buttons */}
              <div className="mt-3 flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                {pendingPreview ? (
                  <>
                    <button
                      type="button"
                      onClick={handleSavePhoto}
                      disabled={isUploadingPhoto}
                      className="px-4 py-1.5 text-xs font-bold rounded-xl bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-50 transition focus:outline-none focus:ring-2 focus:ring-teal-700"
                    >
                      {isUploadingPhoto ? 'Saving...' : 'Save photo'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelPhoto}
                      disabled={isUploadingPhoto}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-1.5 text-xs font-bold rounded-xl border-2 border-teal-700 text-teal-700 hover:bg-teal-700 hover:text-white transition focus:outline-none focus:ring-2 focus:ring-teal-700"
                    >
                      Change photo
                    </button>
                    {hasCustomPhoto && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        disabled={isDeletingPhoto}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition disabled:opacity-50"
                      >
                        {isDeletingPhoto ? 'Removing…' : 'Remove photo'}
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Hint text */}
              <p className="text-[11px] text-gray-400 mt-2">
                JPG, PNG or WebP, max 5 MB
              </p>

              {/* Avatar inline message */}
              {avatarMsg && (
                <div
                  className={`mt-2 p-2.5 rounded-lg text-xs font-semibold ${
                    avatarMsg.type === 'success'
                      ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                      : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
                  }`}
                >
                  {avatarMsg.type === 'success' ? '✓ ' : '⚠ '}{avatarMsg.text}
                </div>
              )}
            </div>
          </div>

          {/* Name + Email fields */}
          <form onSubmit={handleSaveName} className="space-y-6">
            {/* Name */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="display-name"
                  className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Display Name
                </label>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline focus:outline-none focus:ring-2 focus:ring-teal-700 rounded"
                  >
                    Edit
                  </button>
                )}
              </div>
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    id="display-name"
                    ref={nameInputRef}
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    maxLength={80}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white dark:focus:bg-slate-800 transition"
                    style={{ color: 'var(--main-text)' }}
                    placeholder="Your display name"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isSaving || !nameInput.trim()}
                      className="px-5 py-2 text-sm font-bold text-white rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-50 transition focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2"
                    >
                      {isSaving ? 'Saving…' : 'Save name'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-5 py-2 text-sm font-bold rounded-xl border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition focus:outline-none focus:ring-2 focus:ring-teal-700"
                      style={{ color: 'var(--main-text)' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-700 font-medium text-sm"
                  style={{ color: 'var(--main-text)' }}>
                  {user.name}
                </p>
              )}
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800/60 font-medium cursor-not-allowed"
                style={{ color: 'var(--sage-green)' }}
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Email is linked to your account and cannot be changed here.
              </p>
            </div>

            {/* Save feedback */}
            {saveMsg && (
              <div className={`p-3 rounded-xl border text-xs font-semibold ${
                saveMsg.type === 'success'
                  ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300'
                  : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
              }`}>
                {saveMsg.type === 'success' ? '✓ ' : '⚠ '}{saveMsg.text}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
