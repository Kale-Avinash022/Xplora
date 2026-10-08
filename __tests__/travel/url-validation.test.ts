// __tests__/travel/url-validation.test.ts
// Step 86: Deep-Link Security Unit Tests

import assert from 'node:assert';
import { validateProviderUrl } from '../../lib/travel/validation';

async function runUrlValidationTests() {
  console.log('\n--- Running Step 86: Deep-Link Security Unit Tests ---\n');

  // Test 1: Rejection of non-HTTPS schemes
  assert.strictEqual(validateProviderUrl('http://www.google.com'), undefined, 'HTTP must be rejected');
  assert.strictEqual(validateProviderUrl('ftp://booking.com/offer'), undefined, 'FTP must be rejected');

  // Test 2: Rejection of malicious schemes
  assert.strictEqual(validateProviderUrl('javascript:alert(1)'), undefined, 'javascript: must be rejected');
  assert.strictEqual(validateProviderUrl('data:text/html;base64,...'), undefined, 'data: must be rejected');
  assert.strictEqual(validateProviderUrl('file:///etc/passwd'), undefined, 'file: must be rejected');

  // Test 3: Rejection of unapproved domains / phishing
  assert.strictEqual(validateProviderUrl('https://evil-booking.com/fake'), undefined, 'Unapproved domain must be rejected');
  assert.strictEqual(validateProviderUrl('https://google.com.attacker.com/path'), undefined, 'Subdomain spoofing must be rejected');
  assert.strictEqual(validateProviderUrl('https://booking.com.hacker.io'), undefined, 'Domain suffix spoofing must be rejected');

  // Test 4: Acceptance of approved domains
  const googleFlights = 'https://www.google.com/travel/flights/booking?token=abc123xyz';
  assert.strictEqual(validateProviderUrl(googleFlights), googleFlights, 'Approved Google link must be accepted');

  const bookingHotel = 'https://booking.com/hotel/in/grand-hyatt-goa.html';
  assert.strictEqual(validateProviderUrl(bookingHotel), bookingHotel, 'Approved Booking.com link must be accepted');

  const redbusUrl = 'https://www.redbus.in/bus-tickets/pune-to-goa';
  assert.strictEqual(validateProviderUrl(redbusUrl), redbusUrl, 'Approved RedBus link must be accepted');

  const qrailUrl = 'https://api.qrail.in/booking/confirm';
  assert.strictEqual(validateProviderUrl(qrailUrl), qrailUrl, 'Approved Qrail link must be accepted');

  // Test 5: Rejection of empty, whitespace, null, or malformed inputs
  assert.strictEqual(validateProviderUrl(null), undefined, 'null must return undefined');
  assert.strictEqual(validateProviderUrl(undefined), undefined, 'undefined must return undefined');
  assert.strictEqual(validateProviderUrl('   '), undefined, 'Whitespace must return undefined');
  assert.strictEqual(validateProviderUrl('not a url at all'), undefined, 'Malformed string must return undefined');

  console.log('✓ All Deep-Link Security tests passed successfully!\n');
}

runUrlValidationTests().catch((err) => {
  console.error('URL validation tests failed:', err);
  process.exit(1);
});
