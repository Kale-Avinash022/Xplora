// __tests__/chat/contracts.test.ts
// Step 88: Chat Contract & Validation Unit Tests

import assert from 'node:assert';
import { ALLOWED_ACTION_COMMANDS, ActionCommand } from '../../lib/chat/contracts';
import { POST } from '../../app/api/chat/route';

async function runChatContractsTests() {
  console.log('\n--- Running Step 88: Chat Contract & Validation Unit Tests ---\n');

  // Test 1: Allowed action commands are preserved
  assert.strictEqual(ALLOWED_ACTION_COMMANDS.size, 4, 'Must have exactly 4 allowed commands');
  assert.ok(ALLOWED_ACTION_COMMANDS.has('APPLY_TRIP_DETAILS'), 'Must include APPLY_TRIP_DETAILS');
  assert.ok(ALLOWED_ACTION_COMMANDS.has('EXPORT_PDF'), 'Must include EXPORT_PDF');
  assert.ok(ALLOWED_ACTION_COMMANDS.has('EXPORT_CALENDAR'), 'Must include EXPORT_CALENDAR');
  assert.ok(ALLOWED_ACTION_COMMANDS.has('SAVE_TRIP'), 'Must include SAVE_TRIP');

  // Test 2: Unknown action commands are rejected / not in allowlist
  assert.strictEqual(ALLOWED_ACTION_COMMANDS.has('BOOK_FLIGHT_INSTANTLY' as any), false);
  assert.strictEqual(ALLOWED_ACTION_COMMANDS.has('DELETE_USER' as any), false);
  assert.strictEqual(ALLOWED_ACTION_COMMANDS.has('EXECUTE_PAYMENT' as any), false);

  // Test 3: Route returns graceful unavailable when GEMINI_API_KEY is unset
  const originalKey = process.env.GEMINI_API_KEY;
  try {
    delete process.env.GEMINI_API_KEY;
    const req = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Plan a trip to Goa' }],
      }),
    });
    const res = await POST(req);
    assert.strictEqual(res.status, 200, 'Must return HTTP 200 with honest unavailable envelope');
    const data = await res.json();
    assert.strictEqual(data.isAvailable, false, 'isAvailable must be false when key is unset');
    assert.ok(data.message.includes('unavailable') || data.message.includes('unconfigured'));
    assert.strictEqual(data.tripProposal, null);
    assert.strictEqual(data.actionCommand, null);
  } finally {
    if (originalKey !== undefined) {
      process.env.GEMINI_API_KEY = originalKey;
    }
  }

  // Test 4: Excessive message histories and long strings are safely bounded
  const longMessages = Array.from({ length: 30 }, (_, i) => ({
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: `Message ${i}: ` + 'A'.repeat(1000), // Exceeds 500 characters
  }));

  const boundReq = new Request('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: longMessages,
    }),
  });
  const boundRes = await POST(boundReq);
  assert.strictEqual(boundRes.status, 200, 'Bounded message payload must process without error');

  console.log('✓ All Chat Contracts and Validation tests passed successfully!\n');
}

runChatContractsTests().catch((err) => {
  console.error('Chat contracts tests failed:', err);
  process.exit(1);
});
