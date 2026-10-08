// __tests__/travel/serpapi-normalization.test.ts
// Step 87: SerpAPI Normalization Unit Tests

import assert from 'node:assert';
import { normalizeSerpApiFlights, normalizeSerpApiHotels } from '../../lib/travel/providers/serpapi';

async function runSerpApiNormalizationTests() {
  console.log('\n--- Running Step 87: SerpAPI Normalization Unit Tests ---\n');

  // Test 1: Flight normalizer parses real provider payload
  const rawFlightsPayload = {
    best_flights: [
      {
        flights: [
          {
            airline: 'IndiGo',
            flight_number: '6E 214',
            departure_airport: { id: 'BOM', name: 'Chhatrapati Shivaji', time: '2026-11-01 06:00' },
            arrival_airport: { id: 'DEL', name: 'Indira Gandhi', time: '2026-11-01 08:15' },
            travel_class: 'Economy',
            airline_logo: 'https://images.kiwi.com/airlines/64/6E.png',
          },
        ],
        total_duration: 135,
        price: 4500,
        booking_token: 'valid_token_123',
      },
      // Invalid flight missing price - must be discarded
      {
        flights: [
          {
            airline: 'Air India',
            departure_airport: { id: 'BOM', time: '2026-11-01 10:00' },
            arrival_airport: { id: 'DEL', time: '2026-11-01 12:15' },
          },
        ],
        total_duration: 135,
        price: null,
      },
    ],
    other_flights: [
      {
        flights: [
          {
            airline: 'Air India',
            flight_number: 'AI 803',
            departure_airport: { id: 'BOM', time: '2026-11-01 14:00' },
            arrival_airport: { id: 'HYD', time: '2026-11-01 15:30' },
          },
          {
            airline: 'Air India',
            flight_number: 'AI 804',
            departure_airport: { id: 'HYD', time: '2026-11-01 17:00' },
            arrival_airport: { id: 'DEL', time: '2026-11-01 19:30' },
          },
        ],
        total_duration: 330,
        price: 6200,
      },
    ],
  };

  const normalizedFlights = normalizeSerpApiFlights(rawFlightsPayload, 'INR');
  assert.strictEqual(normalizedFlights.length, 2, 'Must keep valid offers and drop offers with missing price');

  const firstFlight = normalizedFlights[0];
  assert.strictEqual(firstFlight.airline, 'IndiGo');
  assert.strictEqual(firstFlight.flightNumber, '6E 214');
  assert.strictEqual(firstFlight.departureAirport, 'BOM');
  assert.strictEqual(firstFlight.arrivalAirport, 'DEL');
  assert.strictEqual(firstFlight.price, 4500);
  assert.strictEqual(firstFlight.currency, 'INR');
  assert.strictEqual(firstFlight.isNonStop, true);
  assert.strictEqual(firstFlight.stops, 'Non-stop');
  assert.ok(firstFlight.bookingUrl?.includes('google.com/travel/flights'), 'Booking URL must be verified');

  const connectingFlight = normalizedFlights[1];
  assert.strictEqual(connectingFlight.airline, 'Air India');
  assert.strictEqual(connectingFlight.stops, '1 Stop');
  assert.strictEqual(connectingFlight.isNonStop, false);
  assert.strictEqual(connectingFlight.price, 6200);

  // Test 2: Hotel normalizer parses real provider payload
  const rawHotelsPayload = {
    properties: [
      {
        name: 'Taj Exotica Resort & Spa',
        rate_per_night: {
          extracted_lowest: 18500,
        },
        overall_rating: 4.8,
        reviews: 2450,
        amenities: ['Pool', 'Spa', 'Free WiFi', 'Beach access'],
        images: [{ thumbnail: 'https://images.example.com/taj.jpg' }],
        link: 'https://www.booking.com/hotel/in/taj-exotica-goa.html',
      },
      // Missing rate - must be dropped
      {
        name: 'Unpriced Stay',
        overall_rating: 3.5,
      },
      // Valid minimal stay with string rate
      {
        name: 'Cozy Beach Shack',
        rate_per_night: {
          lowest: '₹ 2,500',
        },
        overall_rating: 4.2,
        reviews: 80,
      },
    ],
  };

  const normalizedHotels = normalizeSerpApiHotels(rawHotelsPayload, 'INR');
  assert.strictEqual(normalizedHotels.length, 2, 'Must keep valid properties and drop unpriced properties');

  const luxuryHotel = normalizedHotels[0];
  assert.strictEqual(luxuryHotel.name, 'Taj Exotica Resort & Spa');
  assert.strictEqual(luxuryHotel.pricePerNight, 18500);
  assert.strictEqual(luxuryHotel.currency, 'INR');
  assert.strictEqual(luxuryHotel.rating, 4.8);
  assert.strictEqual(luxuryHotel.reviewsCount, 2450);
  assert.strictEqual(luxuryHotel.bookingUrl, 'https://www.booking.com/hotel/in/taj-exotica-goa.html');

  const budgetShack = normalizedHotels[1];
  assert.strictEqual(budgetShack.name, 'Cozy Beach Shack');
  assert.strictEqual(budgetShack.pricePerNight, 2500);
  assert.strictEqual(budgetShack.rating, 4.2);

  console.log('✓ All SerpAPI Normalization tests passed successfully!\n');
}

runSerpApiNormalizationTests().catch((err) => {
  console.error('SerpAPI normalization tests failed:', err);
  process.exit(1);
});
