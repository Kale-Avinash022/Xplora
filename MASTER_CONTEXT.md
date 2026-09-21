# XPLORA — Master Project Context Document
> **Single source of truth** for architecture, global state, file dependencies, API contracts, and design rules.
> Provide this file at the start of every session — no need to re-upload individual files.
> Last updated: September 2026

---

## 1. PROJECT IDENTITY

| Field | Value |
|---|---|
| **Name** | XPLORA Intelligence Engine v2.4 |
| **Tagline** | Intelligent AI Travel Itinerary Generator |
| **Stack** | Next.js 14 (App Router) + Python FastAPI backend |
| **Primary Language** | TypeScript (frontend), Python (backend) |
| **Styling** | Tailwind CSS + inline style objects |
| **Database** | PostgreSQL via Prisma ORM |
| **Status** | Active development — Phase 4 of 8 |
| **Customer Support** | 24/7 Support: xploraAI@gmail.com \| +91 8007595006 |

**Color Palette (Brand Tokens):**
```
Forest Green (primary):   #263D32
Sage Green (secondary):   #526B57
Warm Beige (background):  #F4F1E6
Sand Border:              #E1DDD1
Gold Accent:              #C6A96B
Near-black text:          #292A25
```

**Typography:** Playfair Display, serif (headings) | system sans-serif (body)

---

## 2. MONOREPO DIRECTORY STRUCTURE

```
Xplora/
├── app/                          ← Next.js App Router
│   ├── page.tsx                  ← MAIN PAGE (1114 lines) — see §4
│   ├── layout.tsx                ← Root layout, font imports
│   ├── globals.css               ← Global CSS + marquee animation
│   ├── xlp.page.tsx              ← (Legacy / unused XLP page)
│   ├── login/                    ← Login page route
│   ├── signup/                   ← Signup page route
│   └── api/                      ← Next.js API Routes (§5)
│       ├── auth/                 ← Login, signup, session
│       ├── chat/                 ← AI chatbot endpoint
│       ├── flights/              ← Flight search (SerpAPI / catalog fallback)
│       ├── generate-itinerary/   ← Core AI itinerary generator
│       ├── hotels/               ← Hotel search
│       ├── itineraries/          ← CRUD for saved trips (Prisma)
│       ├── parse-query/          ← NLP prompt parser
│       └── weather/              ← Live weather via Open-Meteo
│
├── components/                   ← Shared React components (§6)
│   ├── AIChatDrawer.tsx          ← Floating AI chatbot drawer
│   ├── ConfirmParsedDetailsModal.tsx  ← (Removed from flow — legacy, keep archived)
│   ├── DarkModeToggle.tsx        ← Theme switcher
│   ├── ExpenseTracker.tsx        ← Real-time budget tracker
│   ├── FlightHotelResults.tsx    ← Results renderer for flights & hotels
│   ├── InteractiveMap.tsx        ← Leaflet.js GPS route map
│   ├── Logo.tsx                  ← SVG logo component
│   ├── MyTripsModal.tsx          ← Saved trips browser modal
│   ├── WeatherCard.tsx           ← Destination weather widget
│   └── WeatherSwapBanner.tsx     ← Alert banner for weather-triggered swaps
│
├── lib/                          ← Utility modules (§7)
│   ├── currencyUtils.ts          ← Currency conversion + SUPPORTED_CURRENCIES
│   ├── destinationsKnowledge.ts  ← Static AI knowledge base (20 destinations, ~40KB)
│   ├── exportUtils.ts            ← PDF / Google Calendar / ICS export
│   ├── prisma.ts                 ← Prisma singleton client
│   └── weather.ts                ← Weather fetcher + icon mapper
│
├── backend/                      ← Python FastAPI Server
│   ├── main.py                   ← Core FastAPI app (417 lines)
│   ├── requirements.txt          ← Python deps
│   └── venv/                     ← Virtual environment (gitignored)
│
├── prisma/                       ← Database schema + migrations
│   └── schema.prisma             ← User, Itinerary, DayPlan models
│
├── public/                       ← Static assets
│   ├── logo.png                  ← Brand logo (circular)
│   └── images/                   ← Destination JPEGs (slug-named, e.g. goa.jpeg)
│
├── .env.local                    ← Secret keys (NOT in git)
├── .env.example                  ← Key template (in git)
├── MASTER_CONTEXT.md             ← THIS FILE (local only)
└── XPLORA_OVERVIEW.txt           ← Architecture overview doc
```

---

## 3. GLOBAL STATE SCHEMA (app/page.tsx)

All state lives in the single Home component. No external state manager.

```typescript
// Auth
currentUser: { id: string; name: string; email: string } | null
  → Populated from localStorage key: 'xplora_user'

// Booking Tab
activeTab: 'FLIGHTS' | 'HOTELS' | 'TRAINS' | 'BUSES'
from: string          // origin city
to: string            // destination city
departure: string     // ISO date
returnDate: string
travellers: string    // '1'–'9'
classType: string

// AI Itinerary Generator
nlQueryPrompt: string         // Main NL prompt (PRIMARY input bar)
aiDestination: string         // default: 'Goa'
aiDuration: number            // default: 3
aiBudget: number              // default: 25000
aiTravelStyle: string         // default: 'Adventure'
aiTravelDate: string          // ISO date, default: today
isGenerating: boolean
generatedPlan: ItineraryResponse | null

// Save/Export
isSaving: boolean
saveSuccess: boolean
authErrorMsg: string | null   // shown when saving without login
showMyTripsModal: boolean

// Service Search
flightsResults: FlightOption[]
hotelsResults: HotelOption[]
isSearchLoading: boolean
selectedCurrency: string      // default: 'INR'
```

---

## 4. CRITICAL USER FLOWS

### Flow A — AI Trip Generation (PRIMARY, Direct Single-Action)
```
User types prompt in nlQueryPrompt input
→ Clicks "🚀 Generate AI Trip Itinerary" (or presses Enter)
→ handleGenerateDirectFromPrompt()
  1. POST /api/parse-query { prompt }  — silent NLP extraction
     → Updates aiDestination, aiBudget, aiDuration, aiTravelStyle, aiTravelDate
  2. POST /api/generate-itinerary { destination, durationDays, budget, travelStyle, startDate }
     → Sets generatedPlan → auto-scrolls to #generated-itinerary-results
  3. Parallel: GET /api/flights + GET /api/hotels (proactive prefetch)
```

### Flow B — Popular Destination Quick-Select
```
User clicks DestinationCard in marquee
→ handleSelectPopularDestination(destName)
  → nlQueryPrompt = "Plan a 4-day trip to {destName} for 2 people under ₹35,000"
  → Calls handleGenerateDirectFromPrompt() immediately
```

### Flow C — AI Chat → Create Trip
```
User chats in AIChatDrawer
→ onCreateTripFromChat({ destination, from, durationDays, budget, travelStyle, startDate })
  → Sets all AI state fields → calls handleGenerateDirectFromPrompt(chatPrompt)
```

### Flow D — Save Trip
```
handleSaveItinerary()
→ Requires currentUser (else shows authErrorMsg + login link)
→ POST /api/itineraries { title, destination, durationDays, budget, currency, travelStyle, userId, dayPlans }
→ On success: setSaveSuccess(true) → auto-opens MyTripsModal after 600ms
```

---

## 5. API ENDPOINT CONTRACTS

### Next.js Routes (app/api/)
| Endpoint | Method | Key Inputs | Key Outputs |
|---|---|---|---|
| /api/parse-query | POST | { prompt } | { entities: { destination, budget, durationDays, travelStyle, startDate } } |
| /api/generate-itinerary | POST | { destination, durationDays, budget, travelStyle, startDate } | ItineraryResponse |
| /api/flights | GET | ?from=&to=&date= | { flights: FlightOption[] } |
| /api/hotels | GET | ?destination=&checkIn= | { hotels: HotelOption[] } |
| /api/weather | GET | ?destination= | { temp, condition, recommendation, icon, packingAdvice, packingBadge } |
| /api/itineraries | GET | ?userId= | { itineraries: SavedItinerary[] } |
| /api/itineraries | POST | { title, destination, durationDays, budget, currency, travelStyle, userId, dayPlans } | { itinerary } |
| /api/auth | POST | { action: 'login'|'signup', email, password, name? } | { user: { id, name, email } } |
| /api/chat | POST | { messages: [], currentItinerary? } | { reply: string } |

### FastAPI Backend (localhost:8000)
| Endpoint | Method | Notes |
|---|---|---|
| POST /generate-itinerary | POST | Takes ItineraryRequest, returns ItineraryResponse |
| GET /destinations | GET | List of supported destinations |
| GET /docs | GET | Swagger UI |

**ItineraryResponse shape:**
```typescript
{
  title: string
  destination: string
  durationDays: number
  totalBudget: number
  estimatedCost: number
  currency: string        // 'INR'
  travelStyle: string
  weatherPreview: { temp, condition, recommendation, icon, packingAdvice, packingBadge }
  weatherSwapNotice: string | null
  dayPlans: DayPlan[]     // DayPlan: { dayNumber, summary, activities: Activity[] }
}
Activity: { timeSlot, title, description, category, cost, location }
```

---

## 6. COMPONENT CONTRACTS

| Component | Key Props |
|---|---|
| AIChatDrawer | currentItinerary, onUpdateItinerary, onCreateTripFromChat, onExecuteActionCommand |
| ExpenseTracker | plannedBudget, currencyCode, destination, dayPlans |
| FlightHotelResults | activeTab, flights, hotels, isLoading, onBook |
| InteractiveMap | destination, dayPlans |
| MyTripsModal | isOpen, onClose, currentUser, onSelectTrip |
| WeatherCard | destination, weather |
| WeatherSwapBanner | weatherNotice: string | null |
| DarkModeToggle | (no props) — toggles 'dark' class on html, persists to localStorage |

---

## 7. LIB MODULE CONTRACTS

| Module | Exports |
|---|---|
| currencyUtils.ts | SUPPORTED_CURRENCIES, convertAmount(amountINR, toCurrency) |
| exportUtils.ts | exportItineraryToPDF(plan), exportToGoogleCalendar(plan), exportToICS(plan) |
| weather.ts | fetchWeather(destination), getWeatherIcon(condition) |
| destinationsKnowledge.ts | DESTINATIONS_KNOWLEDGE (20 Indian destinations, activities/hotels/tips) |
| prisma.ts | prisma (PrismaClient singleton) |

---

## 8. DATABASE SCHEMA (Prisma)

```prisma
model User {
  id          String      @id @default(cuid())
  email       String      @unique
  password    String
  name        String
  createdAt   DateTime    @default(now())
  itineraries Itinerary[]
}

model Itinerary {
  id           String   @id @default(cuid())
  title        String
  destination  String
  durationDays Int
  budget       Float
  currency     String   @default("INR")
  travelStyle  String
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  dayPlans     Json
  createdAt    DateTime @default(now())
}
```

---

## 9. ENVIRONMENT VARIABLES

| Key | Purpose | Fallback |
|---|---|---|
| WEATHER_API_KEY | Weather data | Open-Meteo (free) |
| AVIATIONSTACK_API_KEY | Real flight data | Static catalog |
| SERPAPI_KEY | Google Flights/Hotels | Static catalog |
| RAPIDAPI_KEY | TripAdvisor/Booking.com | Static catalog |
| DATABASE_URL | PostgreSQL | Required for auth/save |

---

## 10. KEY DESIGN RULES

1. **No intermediate form screen** — ConfirmParsedDetailsModal is REMOVED from flow (file kept, not imported).
2. **Direct single-action** — One prompt input bar + one button. NLP parsing is silent/background.
3. **Fallback-first APIs** — All external APIs have static catalog fallbacks.
4. **Inline styles for brand colors** — Use style={{}} for color tokens, Tailwind for layout.
5. **State in page.tsx only** — No Redux/Zustand. Props-down, callbacks-up.
6. **Auth = localStorage** — xplora_user key: { id, name, email }. No JWT cookies.
7. **Destination images** — public/images/{slug}.jpeg with Unsplash URL fallback in DestinationCard.
8. **Marquee CSS** — Defined in globals.css: .marquee-viewport, .marquee-track, .marquee-card.

---

## 11. RUN COMMANDS

```powershell
# Frontend
cd "C:\Users\avina\OneDrive\Desktop\Xplora\Xplora"
npm run dev
# → http://localhost:3000

# Backend
cd "C:\Users\avina\OneDrive\Desktop\Xplora\Xplora\backend"
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000
# → http://localhost:8000
# → http://localhost:8000/docs
```

---

## 12. UPDATING THIS DOCUMENT

| Change Type | Update Section |
|---|---|
| New state variable | §3 Global State Schema |
| New API endpoint | §5 API Endpoint Contracts |
| New component | §6 Component Contracts |
| New lib utility | §7 Lib Module Contracts |
| New DB model/field | §8 Database Schema |
| New env variable | §9 Environment Variables |
| New design rule | §10 Key Design Rules |
| New user flow | §4 Critical User Flows |

---
*Master Context | Local only — not tracked by Git | Last updated: September 2026*
