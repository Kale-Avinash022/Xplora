import { ItineraryResponse, WishlistItem } from '@/lib/types'

export function slug(str: string): string {
  return (str || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'na'
}

export function djb2Hash(str: string): string {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i)
  }
  return (hash >>> 0).toString(16)
}

export function getItineraryKey(plan: ItineraryResponse | any): string {
  if (!plan) return ''
  const dest = slug(plan.destination || 'trip')
  const duration = plan.durationDays ?? plan.dayPlans?.length ?? 1
  const style = slug(plan.travelStyle || 'general')
  const budget = Math.round(Number(plan.totalBudget ?? plan.budget ?? 0))
  const dayPlansStr = JSON.stringify(plan.dayPlans || [])
  const hash = djb2Hash(dayPlansStr)

  return `${dest}-d${duration}-${style}-b${budget}-${hash}`
}

export function toWishlistItem(plan: ItineraryResponse | any): WishlistItem {
  const totalBudget = Math.round(Number(plan.totalBudget ?? plan.budget ?? 0))
  const durationDays = Number(plan.durationDays ?? plan.dayPlans?.length ?? 1)
  const itemKey = getItineraryKey(plan)

  return {
    itemKey,
    title: plan.title || `Trip to ${plan.destination || 'Destination'}`,
    destination: plan.destination || 'Destination',
    durationDays,
    totalBudget,
    estimatedCost: plan.estimatedCost ?? 0,
    currency: plan.currency || 'INR',
    travelStyle: plan.travelStyle || 'General',
    savedAt: new Date().toISOString(),
    plan: {
      ...plan,
      totalBudget,
      durationDays,
    },
  }
}

export function storageKeyFor(userId?: string | null): string {
  return userId ? `xplora_wishlist_${userId}` : 'xplora_wishlist_guest'
}

export function loadWishlist(userId?: string | null): WishlistItem[] {
  if (typeof window === 'undefined') return []
  try {
    const key = storageKeyFor(userId)
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.error('Failed to load wishlist from localStorage:', err)
    return []
  }
}

export function saveWishlist(items: WishlistItem[], userId?: string | null): void {
  if (typeof window === 'undefined') return
  try {
    const key = storageKeyFor(userId)
    const capped = items.slice(0, 100)
    localStorage.setItem(key, JSON.stringify(capped))
    window.dispatchEvent(new Event('xplora:wishlist-changed'))
  } catch (err) {
    console.error('Failed to save wishlist to localStorage:', err)
  }
}

export function addItem(
  plan: ItineraryResponse | any,
  userId?: string | null
): { items: WishlistItem[]; isFull: boolean; added: boolean; itemKey: string } {
  const current = loadWishlist(userId)
  const itemKey = getItineraryKey(plan)

  // Check if already in list
  const existingIdx = current.findIndex((item) => item.itemKey === itemKey)
  if (existingIdx !== -1) {
    return { items: current, isFull: false, added: false, itemKey }
  }

  // Cap at 100
  if (current.length >= 100) {
    return { items: current, isFull: true, added: false, itemKey }
  }

  const newItem = toWishlistItem(plan)
  const updated = [newItem, ...current]
  saveWishlist(updated, userId)
  return { items: updated, isFull: false, added: true, itemKey }
}

export function removeItem(itemKey: string, userId?: string | null): WishlistItem[] {
  const current = loadWishlist(userId)
  const updated = current.filter((item) => item.itemKey !== itemKey)
  saveWishlist(updated, userId)
  return updated
}

export function clearAll(userId?: string | null): void {
  saveWishlist([], userId)
}

export function mergeLists(
  localList: WishlistItem[],
  serverList: WishlistItem[]
): WishlistItem[] {
  const map = new Map<string, WishlistItem>()

  // Insert server items
  for (const item of serverList) {
    if (item && item.itemKey) {
      map.set(item.itemKey, item)
    }
  }

  // Merge local items (keep the newest savedAt)
  for (const item of localList) {
    if (!item || !item.itemKey) continue
    const existing = map.get(item.itemKey)
    if (!existing) {
      map.set(item.itemKey, item)
    } else {
      const existingDate = new Date(existing.savedAt || 0).getTime()
      const itemDate = new Date(item.savedAt || 0).getTime()
      if (itemDate >= existingDate) {
        map.set(item.itemKey, item)
      }
    }
  }

  // Convert to array and sort descending by savedAt
  const merged = Array.from(map.values()).sort((a, b) => {
    const da = new Date(a.savedAt || 0).getTime()
    const db = new Date(b.savedAt || 0).getTime()
    return db - da
  })

  return merged.slice(0, 100)
}
