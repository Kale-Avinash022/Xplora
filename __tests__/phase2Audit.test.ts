// __tests__/phase2Audit.test.ts
// Phase 2 Verification & Truthfulness Audit (Step 23)

import assert from 'node:assert';
import { resolveIataCode, normalizeSerpApiFlights, sanitizeUrlForLog } from '@/lib/travel/providers/serpapi';
import { validateFlightQuery } from '@/lib/travel/validation';
import * as fs from 'fs';
import * as path from 'path';

async function runPhase2Audit() {
  console.log('\n--- Running Step 23: Phase 2 Verification & Truthfulness Audit ---\n');

  // Test 1: Explicit Airport IATA Mapping & Unsupported City Handling
  console.log('Test 1: Verify unknown city mapping returns null and NEVER defaults to Delhi');
  const unknown1 = resolveIataCode('Zurich');
  assert.strictEqual(unknown1, null, 'Unknown city "Zurich" must return null, not DEL');

  const unknown2 = resolveIataCode('FakeCityXYZ');
  assert.strictEqual(unknown2, null, 'Fake city "FakeCityXYZ" must return null');

  const knownDelhi = resolveIataCode('Delhi');
  assert.strictEqual(knownDelhi, 'DEL', 'Delhi must resolve to DEL');

  const knownMumbai = resolveIataCode('Mumbai');
  assert.strictEqual(knownMumbai, 'BOM', 'Mumbai must resolve to BOM');

  const knownGoa = resolveIataCode('Goa');
  assert.strictEqual(knownGoa, 'GOI', 'Goa must resolve to GOI');

  const knownBlr = resolveIataCode('Bengaluru');
  assert.strictEqual(knownBlr, 'BLR', 'Bengaluru must resolve to BLR');

  console.log('✓ Test 1 Passed: Strict IATA resolution verified. Zero silent fallbacks to Delhi.\n');

  // Test 2: Validation of Flight Query Parameters
  console.log('Test 2: Validate query parameter rules (dates, passenger bounds, identical origins)');
  const pastDateRes = validateFlightQuery({
    origin: 'Delhi',
    destination: 'Mumbai',
    outboundDate: '2020-01-01', // in the past
    travelers: 1,
  });
  assert.strictEqual(pastDateRes.isValid, false, 'Past departure date must fail validation');
  assert.ok(pastDateRes.errors.outboundDate, 'Must report error for past departure date');

  const sameCityRes = validateFlightQuery({
    origin: 'Mumbai',
    destination: 'Mumbai',
    outboundDate: '2026-12-01',
    travelers: 1,
  });
  assert.strictEqual(sameCityRes.isValid, false, 'Identical origin and destination must fail');
  assert.ok(sameCityRes.errors.destination, 'Must report error for identical cities');

  const invalidTravelersRes = validateFlightQuery({
    origin: 'Delhi',
    destination: 'Goa',
    outboundDate: '2026-12-01',
    travelers: 15, // Out of bounds
  });
  assert.strictEqual(invalidTravelersRes.isValid, false, 'Travelers > 9 must fail validation');
  assert.ok(invalidTravelersRes.errors.travelers, 'Must report error for travelers out of bounds');

  const validRes = validateFlightQuery({
    origin: 'Delhi',
    destination: 'Goa',
    outboundDate: '2026-12-01',
    travelers: 2,
    cabinClass: 'Economy',
  });
  assert.strictEqual(validRes.isValid, true, 'Valid query must pass validation');
  assert.strictEqual(validRes.data?.origin, 'Delhi');
  assert.strictEqual(validRes.data?.destination, 'Goa');
  console.log('✓ Test 2 Passed: Parameter validation correctly catches malformed and past-date inputs.\n');

  // Test 3: Credential Redaction in Logging Helper
  console.log('Test 3: Verify credentials redaction in URL logging');
  const sensitiveUrl = 'https://serpapi.com/search.json?engine=google_flights&departure_id=DEL&api_key=SECRET_API_KEY_12345';
  const sanitized = sanitizeUrlForLog(sensitiveUrl);
  assert.ok(!sanitized.includes('SECRET_API_KEY_12345'), 'Sanitized URL must not leak raw API key');
  assert.ok(sanitized.includes('REDACTED'), 'Sanitized URL must contain REDACTED token');
  console.log('✓ Test 3 Passed: URL logging sanitization protects API keys from exposure.\n');

  // Test 4: Provider Response Normalizer Truthfulness & Deep-Link Validation
  console.log('Test 4: Verify SerpAPI response normalizer with mock provider payload');
  const mockSerpApiPayload = {
    best_flights: [
      {
        flights: [
          {
            airline: 'Air India',
            flight_number: 'AI-805',
            departure_airport: { id: 'DEL', name: 'Indira Gandhi International', time: '06:15 AM' },
            arrival_airport: { id: 'BOM', name: 'Chhatrapati Shivaji Maharaj', time: '08:30 AM' },
            travel_class: 'Economy',
            airline_logo: 'https://images.example.com/ai.png',
          },
        ],
        total_duration: 135,
        price: 4500,
        booking_token: 'google_booking_token_sample_123',
      },
      {
        // Invalid item: price missing or 0 -> must be discarded
        flights: [
          {
            airline: 'Phantom Air',
            flight_number: 'PA-000',
            departure_airport: { id: 'DEL', time: '09:00 AM' },
            arrival_airport: { id: 'BOM', time: '11:00 AM' },
          },
        ],
        price: 0,
      },
    ],
  };

  const normalized = normalizeSerpApiFlights(mockSerpApiPayload, 'INR');
  assert.strictEqual(normalized.length, 1, 'Invalid items missing price must be discarded');
  assert.strictEqual(normalized[0].airline, 'Air India');
  assert.strictEqual(normalized[0].flightNumber, 'AI-805');
  assert.strictEqual(normalized[0].price, 4500);
  assert.strictEqual(normalized[0].currency, 'INR');
  assert.strictEqual(normalized[0].isNonStop, true);
  assert.strictEqual(normalized[0].providerName, 'Google Flights via SerpAPI');
  assert.ok(normalized[0].bookingUrl?.startsWith('https://www.google.com/travel/flights/booking'), 'Booking URL must be verified Google travel link');
  console.log('✓ Test 4 Passed: Normalizer produces authentic provider models and discards invalid quotes.\n');

  // Test 5: Static Catalog Purge Verification in app/api/flights/route.ts
  console.log('Test 5: Codebase audit confirming zero synthetic flight generators remain');
  const flightRoutePath = path.join(process.cwd(), 'app', 'api', 'flights', 'route.ts');
  const routeContent = fs.readFileSync(flightRoutePath, 'utf8');

  assert.ok(!routeContent.includes('generate25FlightResults'), 'generate25FlightResults must not exist');
  assert.ok(!routeContent.includes("iataMap[city] || 'DEL'"), 'Silent fallback to DEL must not exist');
  assert.ok(!routeContent.includes('IndiGo Early Morning'), 'Hardcoded catalog airline names must not exist');
  assert.ok(!routeContent.includes('SpiceJet Sunrise'), 'Hardcoded catalog schedules must not exist');
  console.log('✓ Test 5 Passed: Zero static flight generators or fake flight catalogs found in app/api/flights/route.ts.\n');

  console.log('🎉 ALL PHASE 2 TRUTHFULNESS & VERIFICATION AUDITS PASSED SUCCESSFULLY!\n');
}

runPhase2Audit().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
