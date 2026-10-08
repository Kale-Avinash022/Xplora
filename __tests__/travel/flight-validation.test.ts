// __tests__/travel/flight-validation.test.ts
// Step 84: Flight Validation Unit Tests

import assert from 'node:assert';
import { validateFlightQuery, getTodayIsoDate } from '../../lib/travel/validation';

async function runFlightValidationTests() {
  console.log('\n--- Running Step 84: Flight Validation Unit Tests ---\n');

  const today = getTodayIsoDate();
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  // Test 1: Blank origin is rejected
  const res1 = validateFlightQuery({ origin: '', destination: 'Delhi', outboundDate: tomorrow });
  assert.strictEqual(res1.isValid, false, 'Blank origin must be invalid');
  assert.ok(res1.errors.origin, 'Must report origin error');

  // Test 2: Blank destination is rejected
  const res2 = validateFlightQuery({ origin: 'Mumbai', destination: '', outboundDate: tomorrow });
  assert.strictEqual(res2.isValid, false, 'Blank destination must be invalid');
  assert.ok(res2.errors.destination, 'Must report destination error');

  // Test 3: Identical origin and destination are rejected
  const res3 = validateFlightQuery({ origin: 'Goa', destination: 'goa', outboundDate: tomorrow });
  assert.strictEqual(res3.isValid, false, 'Identical origin and destination must be invalid');
  assert.ok(res3.errors.destination?.includes('cannot be the same'), 'Must report same city error');

  // Test 4: Past outbound date is rejected
  const res4 = validateFlightQuery({ origin: 'Mumbai', destination: 'Delhi', outboundDate: yesterday });
  assert.strictEqual(res4.isValid, false, 'Past outbound date must be invalid');
  assert.ok(res4.errors.outboundDate?.includes('past'), 'Must report past date error');

  // Test 5: Return date on or before outbound date is rejected
  const res5 = validateFlightQuery({
    origin: 'Mumbai',
    destination: 'Delhi',
    outboundDate: nextWeek,
    returnDate: tomorrow,
  });
  assert.strictEqual(res5.isValid, false, 'Return date before outbound must be invalid');
  assert.ok(res5.errors.returnDate?.includes('strictly after'), 'Must report return date error');

  // Test 6: Traveler counts < 1 or > 9 are rejected
  const res6a = validateFlightQuery({ origin: 'Mumbai', destination: 'Delhi', outboundDate: tomorrow, travelers: 0 });
  assert.strictEqual(res6a.isValid, false, 'Travelers < 1 must be invalid');
  assert.ok(res6a.errors.travelers, 'Must report travelers error');

  const res6b = validateFlightQuery({ origin: 'Mumbai', destination: 'Delhi', outboundDate: tomorrow, travelers: 10 });
  assert.strictEqual(res6b.isValid, false, 'Travelers > 9 must be invalid');
  assert.ok(res6b.errors.travelers, 'Must report travelers error');

  // Test 7: Invalid cabin class normalizes safely to Economy
  const res7 = validateFlightQuery({
    origin: 'Mumbai',
    destination: 'Delhi',
    outboundDate: tomorrow,
    cabinClass: 'SuperLuxury' as any,
  });
  assert.strictEqual(res7.isValid, true, 'Valid query with unusual cabin class should succeed');
  assert.strictEqual(res7.data?.cabinClass, 'Economy', 'Invalid cabin class must normalize to Economy');

  // Test 8: Valid complete query passes cleanly
  const res8 = validateFlightQuery({
    origin: 'Mumbai',
    destination: 'Delhi',
    outboundDate: tomorrow,
    returnDate: nextWeek,
    travelers: 2,
    cabinClass: 'Business',
  });
  assert.strictEqual(res8.isValid, true, 'Valid query must be valid');
  assert.strictEqual(res8.data?.origin, 'Mumbai');
  assert.strictEqual(res8.data?.destination, 'Delhi');
  assert.strictEqual(res8.data?.outboundDate, tomorrow);
  assert.strictEqual(res8.data?.returnDate, nextWeek);
  assert.strictEqual(res8.data?.travelers, 2);
  assert.strictEqual(res8.data?.cabinClass, 'Business');

  console.log('✓ All Flight Validation tests passed successfully!\n');
}

runFlightValidationTests().catch((err) => {
  console.error('Flight validation tests failed:', err);
  process.exit(1);
});
