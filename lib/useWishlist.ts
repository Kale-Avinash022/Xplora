'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { WishlistItem, ItineraryResponse } from '@/lib/types'
import {
  loadWishlist,
  saveWishlist,
  addItem,
  removeItem,
  clearAll,
  mergeLists,
  getItineraryKey,
} from '@/lib/wishlist'

export interface UseWishlistReturn {
  items: WishlistItem[]
  count: number
  isSaved: (keyOrPlan: string | ItineraryResponse | any) => boolean
  toggle: (plan: ItineraryResponse | any) => boolean
  remove: (key: string) => void
  clear: () => void
  isFull: boolean
  ready: boolean
}

export function useWishlist(): UseWishlistReturn {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [isFull, setIsFull] = useState(false)
  const [ready, setReady] = useState(false)
  const syncLockRef = useRef(false)

  // Get current user id from localStorage safely
  const getCurrentUserId = useCallback((): string | null => {
    if (typeof window === 'undefined') return null
    try {
      const userStr = localStorage.getItem('xplora_user')
      if (userStr) {
        const u = JSON.parse(userStr)
        return u?.id || null
      }
    } catch {
      // ignore
    }
    return null
  }, [])

  // Reload items from local storage
  const refreshFromLocal = useCallback(() => {
    const userId = getCurrentUserId()
    const loaded = loadWishlist(userId)
    setItems(loaded)
    setIsFull(loaded.length >= 100)
  }, [getCurrentUserId])

  // Sync with server if user is logged in
  const syncWithServer = useCallback(async () => {
    const userId = getCurrentUserId()
    if (!userId || syncLockRef.current) return
    syncLockRef.current = true

    try {
      // 1. Fetch server list
      const res = await fetch(`/api/wishlist?userId=${encodeURIComponent(userId)}`)
      if (!res.ok) return
      const data = await res.json()
      const serverItems: WishlistItem[] = Array.isArray(data?.items) ? data.items : []

      // 2. Fetch local user items & guest items (to preserve guest items upon login)
      const localUserItems = loadWishlist(userId)
      const guestItems = loadWishlist(null)
      const combinedLocal = mergeLists(localUserItems, guestItems)

      // Clear guest items if they were merged into user's account
      if (guestItems.length > 0) {
        try {
          localStorage.removeItem('xplora_wishlist_guest')
        } catch {
          // ignore
        }
      }

      // 3. Merge server and local lists
      const merged = mergeLists(combinedLocal, serverItems)
      saveWishlist(merged, userId)
      setItems(merged)
      setIsFull(merged.length >= 100)

      // 4. Find local-only items that need to be pushed to server
      const serverKeySet = new Set(serverItems.map((i) => i.itemKey))
      const localOnly = merged.filter((item) => !serverKeySet.has(item.itemKey))

      for (const item of localOnly) {
        try {
          await fetch('/api/wishlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, item }),
          })
        } catch (postErr) {
          console.warn('Failed to sync item to server:', postErr)
        }
      }
    } catch (err) {
      console.warn('Wishlist server sync failed (falling back to local):', err)
    } finally {
      syncLockRef.current = false
    }
  }, [getCurrentUserId])

  // Initial load inside useEffect to prevent SSR hydration errors
  useEffect(() => {
    refreshFromLocal()
    setReady(true)
    syncWithServer()

    // Listen to local custom event and multi-tab storage events
    const handleLocalChange = () => {
      refreshFromLocal()
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('xplora_wishlist_') || e.key === 'xplora_user') {
        refreshFromLocal()
        if (e.key === 'xplora_user') {
          syncWithServer()
        }
      }
    }

    window.addEventListener('xplora:wishlist-changed', handleLocalChange)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('xplora:wishlist-changed', handleLocalChange)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [refreshFromLocal, syncWithServer])

  const isSaved = useCallback(
    (keyOrPlan: string | ItineraryResponse | any): boolean => {
      if (!keyOrPlan) return false
      const targetKey =
        typeof keyOrPlan === 'string' ? keyOrPlan : getItineraryKey(keyOrPlan)
      return items.some((item) => item.itemKey === targetKey)
    },
    [items]
  )

  const toggle = useCallback(
    (plan: ItineraryResponse | any): boolean => {
      if (!plan) return false
      const userId = getCurrentUserId()
      const key = getItineraryKey(plan)
      const alreadySaved = items.some((item) => item.itemKey === key)

      if (alreadySaved) {
        const updated = removeItem(key, userId)
        setItems(updated)
        setIsFull(updated.length >= 100)

        // Best effort server delete
        if (userId) {
          fetch(`/api/wishlist?userId=${encodeURIComponent(userId)}&itemKey=${encodeURIComponent(key)}`, {
            method: 'DELETE',
          }).catch((err) => console.warn('Server delete failed:', err))
        }
        return false
      } else {
        const { items: updated, isFull: full, added } = addItem(plan, userId)
        setItems(updated)
        setIsFull(full)

        if (added && userId) {
          const item = updated.find((i) => i.itemKey === key)
          if (item) {
            fetch('/api/wishlist', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId, item }),
            }).catch((err) => console.warn('Server post failed:', err))
          }
        }
        return added
      }
    },
    [items, getCurrentUserId]
  )

  const remove = useCallback(
    (key: string) => {
      const userId = getCurrentUserId()
      const updated = removeItem(key, userId)
      setItems(updated)
      setIsFull(updated.length >= 100)

      if (userId) {
        fetch(`/api/wishlist?userId=${encodeURIComponent(userId)}&itemKey=${encodeURIComponent(key)}`, {
          method: 'DELETE',
        }).catch((err) => console.warn('Server delete failed:', err))
      }
    },
    [getCurrentUserId]
  )

  const clear = useCallback(() => {
    const userId = getCurrentUserId()
    clearAll(userId)
    setItems([])
    setIsFull(false)

    if (userId) {
      fetch(`/api/wishlist?userId=${encodeURIComponent(userId)}&all=true`, {
        method: 'DELETE',
      }).catch((err) => console.warn('Server clear failed:', err))
    }
  }, [getCurrentUserId])

  return {
    items,
    count: items.length,
    isSaved,
    toggle,
    remove,
    clear,
    isFull,
    ready,
  }
}
