export type OfferCategory =
  | 'Flights'
  | 'Hotels'
  | 'Holidays'
  | 'Homestays'
  | 'Buses'
  | 'Cabs'
  | 'Special Offers'

export type OfferExpiry =
  | { type: 'fixed'; at: string }
  | { type: 'daily'; hour: number; minute: number }

export interface Offer {
  id: string
  title: string
  description: string
  categories: OfferCategory[]
  code?: string
  expiry: OfferExpiry
  cta: 'Book Now' | 'View Details' | 'Explore Now'
  emoji: string
  steps: string[]
  terms: string[]
}

export interface TimeLeft {
  expired: boolean
  totalMs: number
  days: number
  hours: number
  minutes: number
  seconds: number
}

export const OFFERS: Offer[] = [
  {
    id: 'icici-luxury-international-hotels',
    title: 'Up to 15% OFF on 3, 4 & 5-Star Stays',
    description: 'Up to 15% instant discount on International Hotels with ICICI Bank Credit Cards and Credit Card EMI.',
    categories: ['Hotels'],
    code: 'ICICILUXURYINT',
    expiry: { type: 'daily', hour: 21, minute: 14 },
    cta: 'View Details',
    emoji: '🏨',
    steps: [
      'Search and select any participating 3, 4, or 5-star international hotel.',
      'Proceed to checkout and enter promo code ICICILUXURYINT.',
      'Complete payment using an eligible ICICI Bank Credit Card or EMI.',
    ],
    terms: [
      'Valid exclusively on ICICI Bank Credit Cards and Credit Card EMI transactions.',
      'Applicable on select international luxury hotel properties with minimum booking value ₹10,000.',
      'Offer cannot be clubbed with other bank discounts or promotional vouchers.',
    ],
  },
  {
    id: 'icici-luxury-hotels',
    title: 'Up to 15% Instant Discount on Stays',
    description: 'with ICICI Bank Credit Cards and Credit Card EMI',
    categories: ['Hotels'],
    code: 'ICICILUXURY',
    expiry: { type: 'daily', hour: 23, minute: 52 },
    cta: 'View Details',
    emoji: '🏨',
    steps: [
      'Browse luxury stays and handpicked premium hotels across India.',
      'Apply coupon code ICICILUXURY at the payment step.',
      'Pay using your ICICI Bank Credit Card or EMI option to receive instant savings.',
    ],
    terms: [
      'Valid for bookings made on domestic luxury hotels and premium partner stays.',
      'Discount is calculated on base fare before taxes and surcharges.',
      'Limited to one booking per cardholder per calendar month.',
    ],
  },
  {
    id: 'flight-meals-advance',
    title: 'Meals for Your Flights at up to 20% Lower Prices',
    description: 'Book your meal in advance and save big on your journey.',
    categories: ['Flights'],
    expiry: { type: 'fixed', at: '2026-12-31T20:35:00+05:30' },
    cta: 'Book Now',
    emoji: '🍱',
    steps: [
      'Select your domestic or international flight booking on Xplora.',
      'Add your preferred in-flight gourmet meals during seat selection.',
      'Discount will be applied automatically at checkout without needing a promo code.',
    ],
    terms: [
      'Pre-book meals at least 24 hours prior to scheduled flight departure.',
      'Offer valid across select domestic and international partner airlines.',
      'Subject to meal availability and airline catering rules.',
    ],
  },
  {
    id: 'flights-homestays-7500-off',
    title: 'Grab Up to ₹7500 OFF on Flights',
    description: 'Big savings for you on flights and homestays.',
    categories: ['Flights', 'Homestays'],
    expiry: { type: 'fixed', at: '2026-09-30T18:20:00+05:30' },
    cta: 'Book Now',
    emoji: '✈️',
    steps: [
      'Search and pick your preferred flight tickets or cozy homestay.',
      'Select the instant savings deal banner on the summary screen.',
      'Complete payment via UPI, net banking, or debit/credit card to claim up to ₹7,500 off.',
    ],
    terms: [
      'Maximum discount capped at ₹7,500 depending on total booking amount.',
      'Valid for combined bookings or standalone flight and homestay reservations.',
      'Cancellation of either booking forfeits the promotional discount.',
    ],
  },
  {
    id: 'worry-free-travel-30-off',
    title: 'Worry-free Travel: Up to 30% OFF + Interest-free EMI',
    description: '3- & 6-month interest-free EMI on flights, stays and holiday packages.',
    categories: ['Flights', 'Holidays', 'Homestays', 'Hotels'],
    expiry: { type: 'fixed', at: '2026-09-30T22:45:00+05:30' },
    cta: 'Book Now',
    emoji: '🌟',
    steps: [
      'Pick any eligible flight, hotel stay, or curated holiday package.',
      'Choose the 3-month or 6-month No Cost EMI payment option at checkout.',
      'Enjoy up to 30% instant discount with interest subvention provided instantly.',
    ],
    terms: [
      'Zero-interest EMI is valid on leading bank credit cards for 3- and 6-month tenures.',
      'Interest cashback or discount is adjusted against total transaction value upfront.',
      'Non-refundable processing fees charged by the issuing bank may apply.',
    ],
  },
  {
    id: 'flights-30-off-emi',
    title: 'Up to 30% OFF + Interest-free EMI on Flights',
    description: 'Domestic & international flights.',
    categories: ['Flights'],
    expiry: { type: 'fixed', at: '2026-12-30T16:10:00+05:30' },
    cta: 'Book Now',
    emoji: '✈️',
    steps: [
      'Search for domestic or international flights on your travel dates.',
      'Select the No-Cost EMI payment method on the payment checkout page.',
      'Verify the 30% discount and complete your transaction.',
    ],
    terms: [
      'Valid on both one-way and round-trip domestic and international flights.',
      'Interest cost is subsidized by Xplora at the time of ticket issuance.',
      'Subject to participating bank approval and credit card limit.',
    ],
  },
  {
    id: 'live-assistance-international-flights',
    title: 'Live Assistance from Travel Experts',
    description: 'For international flight bookings. Call us on 0124 4781869.',
    categories: ['Flights'],
    expiry: { type: 'fixed', at: '2026-12-31T11:40:00+05:30' },
    cta: 'Explore Now',
    emoji: '🎧',
    steps: [
      'Call our dedicated travel concierge hotline at 0124 4781869.',
      'Share your preferred international destinations, layovers, and dates with our expert.',
      'Receive tailored flight recommendations and exclusive phone-only fare discounts.',
    ],
    terms: [
      'Assistance hotline operates 24x7 for international departures and visa queries.',
      'Exclusive phone-assisted discounts apply only to bookings finalized with the agent.',
      'Standard airline cancellation and rescheduling policies apply.',
    ],
  },
  {
    id: 'flights-hotels-15-off',
    title: 'Grab Up to 15% OFF on Flights & Hotels',
    description: 'Flights, Hotels',
    categories: ['Flights', 'Hotels'],
    expiry: { type: 'fixed', at: '2027-03-31T19:25:00+05:30' },
    cta: 'View Details',
    emoji: '✈️',
    steps: [
      'Select any qualifying flight or hotel reservation on Xplora.',
      'The 15% promotional rate will automatically calculate on the review screen.',
      'Confirm your booking with any preferred payment method.',
    ],
    terms: [
      'Valid on bookings made before March 31, 2027.',
      'Applies to base airfare and room tariff; taxes are charged extra.',
      'Offer valid for both single travelers and family bookings.',
    ],
  },
  {
    id: 'international-flights-10000-off',
    title: 'Up to ₹10000 Instant Discount on International Flights',
    description: 'Flights',
    categories: ['Flights'],
    expiry: { type: 'daily', hour: 19, minute: 8 },
    cta: 'View Details',
    emoji: '🌍',
    steps: [
      'Search for international round-trip or multi-city flight routes.',
      'Opt in to the Flash International Saver deal at payment checkout.',
      'Enjoy instant savings up to ₹10,000 deducted directly from the total.',
    ],
    terms: [
      'Flash deal resets daily at 19:08 IST; booking must be completed before cutoff.',
      'Minimum flight booking value of ₹25,000 required.',
      'Valid once per user account per day on international bookings.',
    ],
  },
  {
    id: 'flights-holidays-hotels-35-off-dec',
    title: 'Up to 35% OFF + Interest-free EMI',
    description: 'On flights, stays & holiday packages for your next refreshing break.',
    categories: ['Flights', 'Holidays', 'Hotels'],
    expiry: { type: 'fixed', at: '2026-12-30T13:55:00+05:30' },
    cta: 'Book Now',
    emoji: '🏖️',
    steps: [
      'Choose your year-end vacation package, hotel, or flight combination.',
      'Select eligible bank EMI payment at the final checkout screen.',
      'Get up to 35% instant markdown and split your payment into equal monthly installments.',
    ],
    terms: [
      'Applicable on year-end travel departures up to December 30, 2026.',
      'Includes combination discounts across flight plus hotel bundled packages.',
      'Cancellation fees apply in accordance with hotel and airline policies.',
    ],
  },
  {
    id: 'flights-hotels-holidays-35-off-sep',
    title: 'Up to 35% OFF + Interest-free EMI on Flights, Hotels & Holidays',
    description: 'Flights, Holidays, Hotels',
    categories: ['Flights', 'Holidays', 'Hotels'],
    expiry: { type: 'fixed', at: '2026-09-30T14:30:00+05:30' },
    cta: 'View Details',
    emoji: '🎉',
    steps: [
      'Explore seasonal getaway packages, boutique hotels, or flight options.',
      'Proceed to checkout and verify the seasonal instant discount badge.',
      'Choose No-Cost EMI to divide payments over 3 or 6 months at zero extra interest.',
    ],
    terms: [
      'Valid on bookings confirmed before September 30, 2026, 14:30 IST.',
      'Applicable on minimum booking value of ₹8,000.',
      'Cannot be retroactively applied to previously confirmed itineraries.',
    ],
  },
  {
    id: 'hotels-holidays-tours-15-off',
    title: 'Up to 15% OFF on Hotels, Holidays and Tours & Attractions',
    description: 'Holidays, Homestays, Hotels',
    categories: ['Holidays', 'Homestays', 'Hotels'],
    expiry: { type: 'fixed', at: '2026-09-30T10:05:00+05:30' },
    cta: 'Book Now',
    emoji: '🗺️',
    steps: [
      'Add eligible hotel stays, homestays, or sightseeing tours to your trip.',
      'Review your itinerary and look for the 15% bundle discount in the cost breakdown.',
      'Pay online using cards, net banking, or UPI to confirm your reservation.',
    ],
    terms: [
      'Valid for participating accommodation partners and guided tours.',
      'Discount applies to the experience and stay charges before local service taxes.',
      'Free cancellation terms depend on specific property and tour policies.',
    ],
  },
  {
    id: 'tripassured-bus-bookings',
    title: 'Introducing TripAssured on Bus Bookings',
    description: 'Enjoy guaranteed departures or get a 2X refund.',
    categories: ['Buses'],
    expiry: { type: 'fixed', at: '2026-10-12T17:15:00+05:30' },
    cta: 'Book Now',
    emoji: '🚌',
    steps: [
      'Search for intercity bus routes across India on Xplora.',
      'Look for the TripAssured badge next to partner bus operators.',
      'Book with complete peace of mind knowing your ride is guaranteed.',
    ],
    terms: [
      'If the operator cancels the bus without an alternative, receive 2X refund into original payment mode.',
      'Valid only on bus services marked with the official TripAssured badge.',
      'Claims must be submitted within 24 hours of scheduled departure.',
    ],
  },
  {
    id: 'lowest-forex-rates',
    title: 'Lowest Forex Exchange Rates Guaranteed',
    description: "We'll pay you 2X the differential amount if you find a cheaper rate elsewhere.",
    categories: ['Special Offers'],
    expiry: { type: 'fixed', at: '2026-12-30T09:50:00+05:30' },
    cta: 'Explore Now',
    emoji: '💱',
    steps: [
      'Choose your destination currency or multi-currency forex travel card.',
      'Lock in the live exchange rate with zero markup fees.',
      'If you find a lower verifiable rate elsewhere on the same day, submit a claim for 2X the difference.',
    ],
    terms: [
      'Comparison rate must be from an RBI-authorized foreign exchange dealer on the same business day.',
      'Claim amount capped at ₹5,000 per transaction.',
      'Valid for foreign currency banknotes and multicurrency prepaid forex cards.',
    ],
  },
  {
    id: 'same-day-forex-delivery',
    title: 'Same-Day Doorstep Delivery of Forex',
    description: 'Valid for Multicurrency Forex Card and foreign currency notes.',
    categories: ['Special Offers'],
    expiry: { type: 'fixed', at: '2026-12-30T21:05:00+05:30' },
    cta: 'Explore Now',
    emoji: '🚚',
    steps: [
      'Order foreign currency cash or reload your Xplora Multicurrency Forex Card before 1:00 PM.',
      'Complete instant digital KYC verification with your passport and PAN.',
      'Receive your sealed forex packet at your doorstep on the exact same day.',
    ],
    terms: [
      'Available in select metro cities including Delhi NCR, Mumbai, Bengaluru, and Pune.',
      'Orders placed after 1:00 PM will be delivered on the next business morning.',
      'Recipient must present valid government ID matching the KYC details upon delivery.',
    ],
  },
  {
    id: 'mmt-icici-credit-card',
    title: 'MakeMyTrip ICICI Bank Credit Card: 6% Extra Savings',
    description: 'Apply now and enjoy 6% extra savings every time you travel.',
    categories: ['Flights', 'Holidays', 'Homestays', 'Hotels'],
    expiry: { type: 'fixed', at: '2026-12-30T23:20:00+05:30' },
    cta: 'Book Now',
    emoji: '💳',
    steps: [
      'Apply for the co-branded ICICI Bank Credit Card via Xplora in 5 minutes.',
      'Receive your instant virtual card details upon digital approval.',
      'Book travel on Xplora to earn 6% reward points and instant statement savings.',
    ],
    terms: [
      'Approval subject to ICICI Bank credit underwriting standards and eligibility criteria.',
      '6% reward rate is credited as MyCash points redeemable on future bookings.',
      'Complimentary airport lounge access included as per card tier.',
    ],
  },
  {
    id: 'bus-north-8-off',
    title: 'FLAT 8% OFF on Buses from Delhi, Uttar Pradesh & More',
    description: 'Buses',
    categories: ['Buses'],
    code: 'MMTNORTH',
    expiry: { type: 'fixed', at: '2026-12-30T15:45:00+05:30' },
    cta: 'Book Now',
    emoji: '🚌',
    steps: [
      'Select any bus departing from Delhi NCR, Uttar Pradesh, Punjab, or Himachal Pradesh.',
      'Enter promo code MMTNORTH on the passenger information screen.',
      'Get an instant 8% discount and complete your payment.',
    ],
    terms: [
      'Applicable on private and state transport bus routes originating in North India.',
      'Maximum discount ₹200 per ticket transaction.',
      'Valid for bookings through December 30, 2026.',
    ],
  },
  {
    id: 'bus-south-8-off',
    title: 'FLAT 8% OFF on Buses in Karnataka, Andhra Pradesh & More',
    description: 'Buses',
    categories: ['Buses'],
    code: 'MMTSOUTH',
    expiry: { type: 'fixed', at: '2026-12-30T18:40:00+05:30' },
    cta: 'Book Now',
    emoji: '🚌',
    steps: [
      'Choose bus routes in Karnataka, Tamil Nadu, Andhra Pradesh, Telangana, or Kerala.',
      'Type coupon code MMTSOUTH in the promo code input at checkout.',
      'Enjoy 8% instant fare savings.',
    ],
    terms: [
      'Valid on AC Sleeper, Semi-Sleeper, and Volvo bus services in South India.',
      'Maximum discount capped at ₹250 per booking.',
      'Offer can be redeemed up to 3 times per user.',
    ],
  },
  {
    id: 'tickets-to-happiness-bus',
    title: '#TicketsToHappiness: Up to 10% OFF on Bus Bookings',
    description: 'Hop aboard & save big.',
    categories: ['Buses'],
    code: 'MEGABUS',
    expiry: { type: 'fixed', at: '2026-12-31T22:10:00+05:30' },
    cta: 'Book Now',
    emoji: '🎫',
    steps: [
      'Search bus tickets for your upcoming holiday or weekend road trip.',
      'Apply coupon code MEGABUS in the promotional box.',
      'Save up to 10% instantly on ticket checkout.',
    ],
    terms: [
      'Offer valid on select top-rated bus operators across all routes in India.',
      'Maximum discount ₹300 per passenger.',
      'Not valid on government road transport RTC tickets.',
    ],
  },
  {
    id: 'forex-cashback-7500',
    title: 'Up to ₹7500 Cashback on Forex',
    description: 'Also enjoy same-day doorstep delivery.',
    categories: ['Special Offers'],
    expiry: { type: 'fixed', at: '2026-12-30T17:30:00+05:30' },
    cta: 'Explore Now',
    emoji: '💰',
    steps: [
      'Load or purchase foreign currency valued at ₹50,000 or higher.',
      'Select the cashback promotional banner during forex order review.',
      'Get up to ₹7,500 cashback directly in your account after successful card activation.',
    ],
    terms: [
      'Cashback tiered based on total forex purchase amount.',
      'Cashback will be credited within 7 working days of card delivery.',
      'Valid once per customer during the promotional period.',
    ],
  },
  {
    id: 'outstation-cabs-new-features',
    title: 'Outstation Cabs, Made More Comfortable',
    description: 'Book outstation cabs with new features for a smoother ride.',
    categories: ['Cabs'],
    expiry: { type: 'fixed', at: '2026-12-30T08:50:00+05:30' },
    cta: 'Book Now',
    emoji: '🚕',
    steps: [
      'Select Outstation One-Way or Round-Trip cab service on Xplora.',
      'Pick your favorite vehicle class from Sedan, SUV, or Prime Executive.',
      'Enjoy verified drivers, GPS trip tracking, and zero toll surprise charges.',
    ],
    terms: [
      'Fares include all state border taxes and expressway tolls on select routes.',
      'Driver allowances included in the displayed estimated total fare.',
      'Free cancellation available up to 6 hours before scheduled pickup.',
    ],
  },
]

export function getOfferById(id: string): Offer | undefined {
  return OFFERS.find((offer) => offer.id === id)
}

export function resolveExpiry(offer: Offer, now: Date): Date {
  if (offer.expiry.type === 'fixed') {
    return new Date(offer.expiry.at)
  }

  // Daily flash deal ending at hour:minute in Asia/Kolkata (IST = UTC+5:30)
  const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000
  const istNow = new Date(now.getTime() + IST_OFFSET_MS)

  const year = istNow.getUTCFullYear()
  const month = istNow.getUTCMonth()
  const date = istNow.getUTCDate()
  const currentHour = istNow.getUTCHours()
  const currentMinute = istNow.getUTCMinutes()

  let targetDate = date
  // If the target time for today has already passed, rollover to tomorrow
  if (
    currentHour > offer.expiry.hour ||
    (currentHour === offer.expiry.hour && currentMinute >= offer.expiry.minute)
  ) {
    targetDate += 1
  }

  const targetUtcMs =
    Date.UTC(year, month, targetDate, offer.expiry.hour, offer.expiry.minute, 0, 0) -
    IST_OFFSET_MS

  return new Date(targetUtcMs)
}

export function formatExpiry(date: Date): string {
  // Asia/Kolkata is UTC+5:30
  const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000
  const ist = new Date(date.getTime() + IST_OFFSET_MS)

  const day = ist.getUTCDate()
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = months[ist.getUTCMonth()]
  const year = ist.getUTCFullYear()
  let hours = ist.getUTCHours()
  const minutes = String(ist.getUTCMinutes()).padStart(2, '0')
  const ampm = hours >= 12 ? 'pm' : 'am'
  hours = hours % 12
  if (hours === 0) hours = 12

  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm} IST`
}

export function getTimeLeft(
  expiry: Date | OfferExpiry | Offer,
  now: Date
): TimeLeft {
  let targetDate: Date
  if (expiry instanceof Date) {
    targetDate = expiry
  } else if ('title' in expiry) {
    targetDate = resolveExpiry(expiry, now)
  } else {
    if (expiry.type === 'fixed') {
      targetDate = new Date(expiry.at)
    } else {
      const dummyOffer: Offer = {
        id: '',
        title: '',
        description: '',
        categories: ['Special Offers'],
        expiry,
        cta: 'View Details',
        emoji: '',
        steps: [],
        terms: [],
      }
      targetDate = resolveExpiry(dummyOffer, now)
    }
  }

  const totalMs = targetDate.getTime() - now.getTime()
  if (totalMs <= 0) {
    return {
      expired: true,
      totalMs: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    }
  }

  const totalSeconds = Math.floor(totalMs / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return {
    expired: false,
    totalMs,
    days,
    hours,
    minutes,
    seconds,
  }
}

export function formatTimeLeft(timeLeft: TimeLeft): string {
  if (timeLeft.expired) {
    return 'Expired'
  }
  if (timeLeft.days > 0) {
    return `${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m left`
  }
  if (timeLeft.hours > 0) {
    return `${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s left`
  }
  return `${timeLeft.minutes}m ${timeLeft.seconds}s left`
}
