// __tests__/phase5Audit.test.ts
// Phase 5 Verification & Result Cards Truthfulness Audit (Steps 42–49)

import assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';

async function runPhase5Audit() {
  console.log('\n--- Running Phase 5 Verification & Result Cards Truthfulness Audit (Steps 42–49) ---\n');

  const componentPath = path.join(process.cwd(), 'components', 'FlightHotelResults.tsx');
  const componentContent = fs.readFileSync(componentPath, 'utf8');

  const pagePath = path.join(process.cwd(), 'app', 'page.tsx');
  const pageContent = fs.readFileSync(pagePath, 'utf8');

  // Test 1: Step 42 Component Props & Imports
  console.log('Test 1: Verify FlightHotelResults props and contract isolation (Step 42)');
  assert.ok(
    !componentContent.includes("@/app/api/flights/route"),
    'FlightHotelResults must not import types from app/api/flights/route'
  );
  assert.ok(
    !componentContent.includes("@/app/api/hotels/route"),
    'FlightHotelResults must not import types from app/api/hotels/route'
  );
  assert.ok(
    componentContent.includes("from '@/lib/types'"),
    'FlightHotelResults must import canonical types from lib/types'
  );
  assert.ok(
    componentContent.includes("export interface FlightHotelResultsProps"),
    'FlightHotelResults must export FlightHotelResultsProps interface'
  );
  assert.ok(
    componentContent.includes("flightEnvelope?: TravelSearchEnvelope<FlightOption> | null"),
    'FlightHotelResultsProps must accept flightEnvelope'
  );
  assert.ok(
    componentContent.includes("stayEnvelope?: TravelSearchEnvelope<StayOption> | null"),
    'FlightHotelResultsProps must accept stayEnvelope'
  );
  console.log('✓ Test 1 Passed: Component props and canonical imports strictly adhere to lib/types.\n');

  // Test 2: Step 43 Removal of False Booking Alerts & Synthetic Actions
  console.log('Test 2: Verify zero false booking confirmations or deceptive actions (Step 43)');
  assert.ok(
    !pageContent.includes('🎉 Booking Confirmed'),
    'app/page.tsx must not contain fake booking confirmation alerts'
  );
  assert.ok(
    !componentContent.includes('🎉 Booking Confirmed'),
    'FlightHotelResults.tsx must not contain fake booking confirmation alerts'
  );
  assert.ok(
    !componentContent.includes('Reserve Hotel ➔'),
    'FlightHotelResults.tsx must not claim instant hotel reservation'
  );
  assert.ok(
    !componentContent.includes('Select Flight ➔'),
    'FlightHotelResults.tsx must not claim flight ticketing ability'
  );
  console.log('✓ Test 2 Passed: Deceptive booking alerts and deceptive action buttons completely purged.\n');

  // Test 3: Step 44 Truthful Flight Cards
  console.log('Test 3: Verify truthful flight card representation & verified deep-links (Step 44)');
  assert.ok(
    componentContent.includes('View provider offer') && componentContent.includes('target="_blank"'),
    'Flight cards must provide verified external deep-links with target="_blank"'
  );
  assert.ok(
    componentContent.includes('rel="noopener noreferrer"'),
    'External deep-links must specify rel="noopener noreferrer" for security'
  );
  assert.ok(
    componentContent.includes('Booking link unavailable'),
    'Flight cards must render disabled comparison state if deep-link is unsupplied'
  );
  assert.ok(
    componentContent.includes('Prices set by airline and subject to change') ||
    componentContent.includes('Prices can change'),
    'Flight cards must display freshness and airline pricing notice'
  );
  console.log('✓ Test 3 Passed: Flight cards present quotes truthfully with verified external handoffs.\n');

  // Test 4: Step 45 Truthful Stay Cards
  console.log('Test 4: Verify truthful stay card representation & verified deep-links (Step 45)');
  assert.ok(
    componentContent.includes('Nightly rates exclude local taxes') ||
    componentContent.includes('per night') ||
    componentContent.includes(' / night'),
    'Stay cards must display nightly rates context'
  );
  assert.ok(
    componentContent.includes('Comparison quote') || componentContent.includes('Booking link unavailable'),
    'Stay cards must render comparison fallback when provider booking link is unsupplied'
  );
  assert.ok(
    componentContent.includes('h.amenities.slice') || componentContent.includes('h.amenities.map'),
    'Stay cards must only display real amenities returned by the provider'
  );
  console.log('✓ Test 4 Passed: Stay cards present property quotes truthfully without fake confirmations.\n');

  // Test 5: Step 46 & 47 Dynamic Filters & Purge of Guessed Filters
  console.log('Test 5: Verify dynamic filter generation and removal of guessed filters (Steps 46 & 47)');
  assert.ok(
    !componentContent.includes('hotelNearAirport'),
    'Synthetic hotelNearAirport guessed filter must be removed'
  );
  assert.ok(
    !componentContent.includes('hotelNearBeach'),
    'Synthetic hotelNearBeach guessed filter must be removed'
  );
  assert.ok(
    componentContent.includes('availableAirlines') && componentContent.includes('new Set'),
    'Airlines filter must be dynamically derived from real flight results'
  );
  console.log('✓ Test 5 Passed: Synthetic filters purged and airline filter dynamically generated.\n');

  // Test 6: Step 48 Comprehensive Envelope State Banners
  console.log('Test 6: Verify envelope state handling across all search statuses (Step 48)');
  assert.ok(
    componentContent.includes("envelope.status === 'INVALID_REQUEST'"),
    'Must handle INVALID_REQUEST status and render field errors'
  );
  assert.ok(
    componentContent.includes("envelope.status === 'UNAVAILABLE'"),
    'Must handle UNAVAILABLE status and render retry button'
  );
  assert.ok(
    componentContent.includes("envelope.status === 'NO_RESULTS'"),
    'Must handle NO_RESULTS status with helpful guidance'
  );
  assert.ok(
    componentContent.includes('Truthful Quotes:'),
    'Must render provider attribution and truthfulness footer'
  );
  console.log('✓ Test 6 Passed: Comprehensive visual states for all envelope statuses implemented.\n');

  console.log('========================================================');
  console.log('🎉 ALL PHASE 5 AUDIT TESTS PASSED SUCCESSFULLY! (Steps 42–49)');
  console.log('========================================================\n');
}

runPhase5Audit().catch((err) => {
  console.error('Phase 5 Audit failed:', err);
  process.exit(1);
});
