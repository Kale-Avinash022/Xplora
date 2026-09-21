export interface Activity {
  id?: string
  timeSlot: string
  title: string
  description?: string | null
  category: string
  cost: number
  location?: string | null
}

export interface DayPlan {
  id?: string
  dayNumber: number
  summary: string
  isDayTrip?: boolean
  totalTravelKm?: number
  activities: Activity[]
}

export interface WeatherPreview {
  temp?: string | number
  condition?: string
  recommendation?: string
  icon?: string
  packingAdvice?: string
  packingBadge?: string
  forecast?: any[]
}

export interface ItineraryResponse {
  id?: string
  title: string
  destination: string
  durationDays: number
  totalBudget: number
  estimatedCost?: number
  currency: string
  travelStyle: string
  weatherPreview?: WeatherPreview | null
  weatherSwapNotice?: string | null
  geocodedCenter?: { lat: number; lng: number }
  hasUnknownPricing?: boolean
  dayPlans: DayPlan[]
}

export interface WishlistItem {
  itemKey: string
  title: string
  destination: string
  durationDays: number
  totalBudget: number
  estimatedCost?: number
  currency: string
  travelStyle: string
  savedAt: string
  plan: ItineraryResponse
}
