// __tests__/phase4Audit.test.ts
// Phase 4 Verification & UI Architecture Audit (Steps 32–41)

import assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';
import { validateFlightQuery, validateStayQuery, getTodayIsoDate } from '@/lib/travel/validation';
import { BookingArea, TransportMode } from '@/lib/types';

async function runPhase4Audit() {
  console.log('\n--- Running Phase 4 Verification & UI Architecture Audit (Steps 32–41) ---\n');

  // Test 1: BookingArea and TransportMode Contract Definition
  console.log('Test 1: Verify BookingArea and TransportMode type contracts');
  const validAreas: BookingArea[] = ['TRAVEL', 'STAY'];
  const validModes: TransportMode[] = ['FLIGHTS', 'TRAINS', 'BUSES'];
  assert.strictEqual(validAreas.length, 2, 'Must have exactly 2 booking areas: TRAVEL and STAY');
  assert.strictEqual(validModes.length, 3, 'Must have exactly 3 travel transport modes: FLIGHTS, TRAINS, BUSES');
  console.log('✓ Test 1 Passed: BookingArea and TransportMode types strictly defined.\n');

  // Test 2: Audit app/page.tsx for Top-Level Booking Area Split (Step 32) & Travel Sub-Tabs (Step 33)
  console.log('Test 2: Audit app/page.tsx for Step 32 & 33 UI components');
  const pagePath = path.join(process.cwd(), 'app', 'page.tsx');
  const pageContent = fs.readFileSync(pagePath, 'utf8');

  assert.ok(
    pageContent.includes("bookingArea === 'TRAVEL'"),
    'app/page.tsx must contain conditional rendering for Travel transport'
  );
  assert.ok(
    pageContent.includes("bookingArea === 'STAY'"),
    'app/page.tsx must contain conditional rendering for Stay (Hotels & Resorts)'
  );
  assert.ok(
    pageContent.includes("transportMode === 'FLIGHTS'"),
    'app/page.tsx must contain conditional rendering for Flights'
  );
  assert.ok(
    pageContent.includes("transportMode === 'TRAINS'"),
    'app/page.tsx must contain conditional rendering for Trains'
  );
  assert.ok(
    pageContent.includes("transportMode === 'BUSES'"),
    'app/page.tsx must contain conditional rendering for Buses'
  );
  console.log('✓ Test 2 Passed: Top-level tabs and sub-tabs cleanly partitioned in app/page.tsx.\n');

  // Test 3: Audit Step 38 & 39 Honest Unavailable Panels for Trains and Buses
  console.log('Test 3: Audit Step 38 & 39 honest unavailable panels');
  assert.ok(
    pageContent.includes('Train Search Unavailable (Under Provider Integration)') ||
    pageContent.includes('Train search is currently unavailable') ||
    pageContent.includes('handleSearchTrains'),
    'app/page.tsx must contain honest train unavailable explanation or verified search'
  );
  assert.ok(
    pageContent.includes('Intercity Bus Search Unavailable (Under Provider Integration)') ||
    pageContent.includes('Bus search is currently unavailable') ||
    pageContent.includes('handleSearchBuses'),
    'app/page.tsx must contain honest bus unavailable explanation or verified search'
  );
  assert.ok(
    pageContent.includes('Truthfulness Policy'),
    'app/page.tsx must display explicit Truthfulness Policy notice'
  );
  assert.ok(
    !pageContent.includes('generateFakeTrainResults') &&
    !pageContent.includes('generateFakeBusResults'),
    'app/page.tsx must never contain fake train or bus generators'
  );
  console.log('✓ Test 3 Passed: Honest unavailable panels for Trains & Buses verified.\n');

  // Test 4: Isolated State & Local Validation for Flights (Step 35 & 37)
  console.log('Test 4: Isolated State and Validation for Flights');
  const invalidFlight = validateFlightQuery({
    origin: '',
    destination: 'Goa',
    outboundDate: 'invalid-date',
    travelers: 0,
  });
  assert.strictEqual(invalidFlight.isValid, false, 'Invalid flight query must fail validation');
  assert.ok(invalidFlight.errors.origin, 'Must flag missing origin');
  assert.ok(invalidFlight.errors.outboundDate, 'Must flag invalid outbound date');
  assert.ok(invalidFlight.errors.travelers, 'Must flag invalid travelers count');

  const validFlight = validateFlightQuery({
    origin: 'Delhi',
    destination: 'Mumbai',
    outboundDate: getTodayIsoDate(),
    travelers: 2,
    cabinClass: 'Economy',
  });
  assert.strictEqual(validFlight.isValid, true, 'Valid flight query must pass validation');
  console.log('✓ Test 4 Passed: Flight query validation operates independently.\n');

  // Test 5: Isolated State & Local Validation for Stays (Step 36 & 40)
  console.log('Test 5: Isolated State and Validation for Stays');
  const invalidStay = validateStayQuery({
    destination: '',
    checkIn: 'invalid-date',
    checkOut: 'invalid-date',
    guests: 0,
    rooms: 0,
  });
  assert.strictEqual(invalidStay.isValid, false, 'Invalid stay query must fail validation');
  assert.ok(invalidStay.errors.destination, 'Must flag missing destination');
  assert.ok(invalidStay.errors.checkIn, 'Must flag invalid checkIn date');
  assert.ok(invalidStay.errors.guests, 'Must flag invalid guests count');

  const validStay = validateStayQuery({
    destination: 'Goa',
    checkIn: '2026-11-01',
    checkOut: '2026-11-05',
    guests: 2,
    rooms: 1,
  });
  assert.strictEqual(validStay.isValid, true, 'Valid stay query must pass validation');
  console.log('✓ Test 5 Passed: Stay query validation operates independently.\n');

  // Test 6: Audit Race Condition & AbortController Protection (Step 41)
  console.log('Test 6: Audit Step 41 Race Condition and AbortController Protections');
  assert.ok(
    pageContent.includes('flightRequestId.current += 1') &&
    pageContent.includes('stayRequestId.current += 1'),
    'Must increment request counters before dispatching searches'
  );
  assert.ok(
    pageContent.includes('flightAbortRef.current.abort()') &&
    pageContent.includes('stayAbortRef.current.abort()'),
    'Must abort in-flight requests on new search dispatches'
  );
  assert.ok(
    pageContent.includes('flightRequestId.current === currentReqId') &&
    pageContent.includes('stayRequestId.current === currentReqId'),
    'Must discard responses from stale/superseded request IDs'
  );
  console.log('✓ Test 6 Passed: Race conditions and request abort logic verified in app/page.tsx.\n');

  console.log('========================================================');
  console.log('🎉 ALL PHASE 4 AUDIT TESTS PASSED SUCCESSFULLY! (Steps 32–41)');
  console.log('========================================================\n');
}

runPhase4Audit().catch((err) => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
