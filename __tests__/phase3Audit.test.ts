// __tests__/phase3Audit.test.ts
// Phase 3 Verification & Stays Truthfulness Audit (Step 31)

import assert from 'node:assert';
import { normalizeSerpApiHotels } from '@/lib/travel/providers/serpapi';
import { validateStayQuery } from '@/lib/travel/validation';
import * as fs from 'fs';
import * as path from 'path';

async function runPhase3Audit() {
  console.log('\n--- Running Step 31: Phase 3 Verification & Stays Truthfulness Audit ---\n');

  // Test 1: Missing check-out date validation
  console.log('Test 1: Verify missing check-out date fails validation');
  const missingCheckOut = validateStayQuery({
    destination: 'Goa',
    checkIn: '2026-11-10',
    guests: 2,
    rooms: 1,
  });
  assert.strictEqual(missingCheckOut.isValid, false, 'Missing check-out must fail validation');
  assert.ok(missingCheckOut.errors.checkOut, 'Must report field error for checkOut');
  console.log('✓ Test 1 Passed: Missing check-out correctly rejected with field error.\n');

  // Test 2: Check-out on or before check-in validation
  console.log('Test 2: Verify check-out on or before check-in fails validation');
  const invalidDateOrder = validateStayQuery({
    destination: 'Goa',
    checkIn: '2026-11-10',
    checkOut: '2026-11-08', // Before check-in
    guests: 2,
    rooms: 1,
  });
  assert.strictEqual(invalidDateOrder.isValid, false, 'Check-out before check-in must fail');
  assert.strictEqual(
    invalidDateOrder.errors.checkOut,
    'Check-out date must be strictly after the check-in date.'
  );

  const sameDateOrder = validateStayQuery({
    destination: 'Goa',
    checkIn: '2026-11-10',
    checkOut: '2026-11-10', // Same day
    guests: 2,
    rooms: 1,
  });
  assert.strictEqual(sameDateOrder.isValid, false, 'Check-out same as check-in must fail');
  console.log('✓ Test 2 Passed: Invalid date sequences correctly caught.\n');

  // Test 3: Guest & Room count boundaries
  console.log('Test 3: Enforce guest and room count policies');
  const excessiveRooms = validateStayQuery({
    destination: 'Mumbai',
    checkIn: '2026-11-10',
    checkOut: '2026-11-12',
    guests: 1,
    rooms: 3, // More rooms than guests
  });
  assert.strictEqual(excessiveRooms.isValid, false, 'Rooms exceeding guests must fail');
  assert.ok(excessiveRooms.errors.rooms, 'Must report error when rooms exceed guests');

  const validStay = validateStayQuery({
    destination: 'Mumbai',
    checkIn: '2026-11-10',
    checkOut: '2026-11-12',
    guests: 2,
    rooms: 1,
    currency: 'INR',
  });
  assert.strictEqual(validStay.isValid, true, 'Valid stay query must pass validation');
  assert.strictEqual(validStay.data?.destination, 'Mumbai');
  console.log('✓ Test 3 Passed: Guest and room count rules enforced.\n');

  // Test 4: Provider Response Normalizer & Deep-Link Validation
  console.log('Test 4: Verify SerpAPI hotel normalizer with mock provider response');
  const mockSerpApiHotels = {
    properties: [
      {
        name: 'Grand Hyatt Goa',
        rate_per_night: {
          extracted_lowest: 11500,
        },
        overall_rating: 4.8,
        reviews: 1420,
        description: 'Bambolim, Goa',
        amenities: ['Pool', 'Spa', 'Free WiFi', 'Beach Access'],
        link: 'https://www.google.com/travel/hotels/entity/sample_hotel_hyatt',
        images: [
          { thumbnail: 'https://images.example.com/hyatt.jpg' },
        ],
        type: '5-Star Luxury Resort',
      },
      {
        // Invalid item: price missing or 0
        name: 'Phantom Inn',
        rate_per_night: {
          lowest: 0,
        },
      },
    ],
  };

  const normalized = normalizeSerpApiHotels(mockSerpApiHotels, 'INR');
  assert.strictEqual(normalized.length, 1, 'Invalid hotel without price must be discarded');
  assert.strictEqual(normalized[0].name, 'Grand Hyatt Goa');
  assert.strictEqual(normalized[0].pricePerNight, 11500);
  assert.strictEqual(normalized[0].rating, 4.8);
  assert.strictEqual(normalized[0].reviewsCount, 1420);
  assert.strictEqual(normalized[0].providerName, 'Google Hotels via SerpAPI');
  assert.ok(normalized[0].bookingUrl?.startsWith('https://www.google.com/travel/hotels'), 'Booking URL must be verified provider link');
  console.log('✓ Test 4 Passed: Normalizer produces authentic property data and discards invalid quotes.\n');

  // Test 5: Static Hotel Catalog Purge Verification in app/api/hotels/route.ts
  console.log('Test 5: Codebase audit confirming zero synthetic hotel catalogs remain');
  const hotelRoutePath = path.join(process.cwd(), 'app', 'api', 'hotels', 'route.ts');
  const routeContent = fs.readFileSync(hotelRoutePath, 'utf8');

  assert.ok(!routeContent.includes('REAL_CITY_HOTELS'), 'REAL_CITY_HOTELS catalog must be deleted');
  assert.ok(!routeContent.includes('generate35HotelResults'), 'generate35HotelResults generator must be deleted');
  assert.ok(!routeContent.includes('COASTAL_DESTINATIONS'), 'Hardcoded COASTAL_DESTINATIONS must be deleted');
  assert.ok(!routeContent.includes('Radisson Blu Hotel Nagpur'), 'Hardcoded hotel names must not exist');
  assert.ok(!routeContent.includes('Taj Exotica Resort & Spa Goa'), 'Hardcoded catalog entries must not exist');
  console.log('✓ Test 5 Passed: Zero static hotel generators or fake hotel catalogs found in app/api/hotels/route.ts.\n');

  console.log('🎉 ALL PHASE 3 TRUTHFULNESS & VERIFICATION AUDITS PASSED SUCCESSFULLY!\n');
}

runPhase3Audit().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
