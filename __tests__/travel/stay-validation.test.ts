// __tests__/travel/stay-validation.test.ts
// Step 85: Stay Validation Unit Tests

import assert from 'node:assert';
import { validateStayQuery, getTodayIsoDate } from '../../lib/travel/validation';

async function runStayValidationTests() {
  console.log('\n--- Running Step 85: Stay Validation Unit Tests ---\n');

  const today = getTodayIsoDate();
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  // Test 1: Blank destination is rejected
  const res1 = validateStayQuery({ destination: '', checkIn: tomorrow, checkOut: nextWeek });
  assert.strictEqual(res1.isValid, false, 'Blank destination must be invalid');
  assert.ok(res1.errors.destination, 'Must report destination error');

  // Test 2: Past check-in date is rejected
  const res2 = validateStayQuery({ destination: 'Goa', checkIn: yesterday, checkOut: tomorrow });
  assert.strictEqual(res2.isValid, false, 'Past check-in date must be invalid');
  assert.ok(res2.errors.checkIn?.includes('past'), 'Must report past check-in error');

  // Test 3: Check-out on or before check-in is rejected
  const res3a = validateStayQuery({ destination: 'Goa', checkIn: tomorrow, checkOut: tomorrow });
  assert.strictEqual(res3a.isValid, false, 'Check-out on check-in date must be invalid');
  assert.ok(res3a.errors.checkOut?.includes('strictly after'), 'Must report check-out error');

  const res3b = validateStayQuery({ destination: 'Goa', checkIn: nextWeek, checkOut: tomorrow });
  assert.strictEqual(res3b.isValid, false, 'Check-out before check-in must be invalid');
  assert.ok(res3b.errors.checkOut?.includes('strictly after'), 'Must report check-out error');

  // Test 4: Guests < 1 or > 9 are rejected
  const res4a = validateStayQuery({ destination: 'Goa', checkIn: tomorrow, checkOut: nextWeek, guests: 0 });
  assert.strictEqual(res4a.isValid, false, 'Guests < 1 must be invalid');
  assert.ok(res4a.errors.guests, 'Must report guests error');

  const res4b = validateStayQuery({ destination: 'Goa', checkIn: tomorrow, checkOut: nextWeek, guests: 10 });
  assert.strictEqual(res4b.isValid, false, 'Guests > 9 must be invalid');
  assert.ok(res4b.errors.guests, 'Must report guests error');

  // Test 5: Rooms exceeding guests are rejected
  const res5 = validateStayQuery({ destination: 'Goa', checkIn: tomorrow, checkOut: nextWeek, guests: 2, rooms: 3 });
  assert.strictEqual(res5.isValid, false, 'Rooms > guests must be invalid');
  assert.ok(res5.errors.rooms?.includes('cannot exceed'), 'Must report rooms exceed guests error');

  // Test 6: Valid stay query passes cleanly
  const res6 = validateStayQuery({
    destination: 'Goa',
    checkIn: tomorrow,
    checkOut: nextWeek,
    guests: 4,
    rooms: 2,
    currency: 'INR',
  });
  assert.strictEqual(res6.isValid, true, 'Valid stay query must succeed');
  assert.strictEqual(res6.data?.destination, 'Goa');
  assert.strictEqual(res6.data?.checkIn, tomorrow);
  assert.strictEqual(res6.data?.checkOut, nextWeek);
  assert.strictEqual(res6.data?.guests, 4);
  assert.strictEqual(res6.data?.rooms, 2);
  assert.strictEqual(res6.data?.currency, 'INR');

  console.log('✓ All Stay Validation tests passed successfully!\n');
}

runStayValidationTests().catch((err) => {
  console.error('Stay validation tests failed:', err);
  process.exit(1);
});
