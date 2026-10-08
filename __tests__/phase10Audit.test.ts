// __tests__/phase10Audit.test.ts
// Phase 10 Verification: Capability Management & Unsupported Modes Safeguards (Steps 78–82)

import assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';
import { getServerCapabilities, getSerpApiKey, getGeminiApiKey } from '../lib/config/capabilities';
import { searchFlightsWithSerpApi, searchHotelsWithSerpApi } from '../lib/travel/providers/serpapi';
import { generateGeminiChatReply } from '../lib/llm/client';

async function runPhase10Audit() {
  console.log('\n--- Running Phase 10 Verification & Capability Management Audit (Steps 78–82) ---\n');

  // Test 1: Step 78 Centralize Capability Configuration
  console.log('Test 1: Verify centralized capability configuration');
  const caps = getServerCapabilities();
  assert.ok(typeof caps.liveFlightsEnabled === 'boolean', 'liveFlightsEnabled must be boolean');
  assert.ok(typeof caps.liveStaysEnabled === 'boolean', 'liveStaysEnabled must be boolean');
  assert.ok(typeof caps.geminiChatEnabled === 'boolean', 'geminiChatEnabled must be boolean');
  assert.ok(typeof caps.liveTrainsEnabled === 'boolean', 'liveTrainsEnabled must be boolean');
  assert.ok(typeof caps.liveBusesEnabled === 'boolean', 'liveBusesEnabled must be boolean');
  console.log('✓ Test 1 Passed: Centralized capabilities configuration verified.\n');

  // Test 2: Step 80 Documentation for Provider Requirements
  console.log('Test 2: Verify provider integration guide documentation');
  const guidePath = path.join(process.cwd(), 'docs', 'PROVIDER_INTEGRATION_GUIDE.md');
  assert.ok(fs.existsSync(guidePath), 'docs/PROVIDER_INTEGRATION_GUIDE.md must exist');
  const guideContent = fs.readFileSync(guidePath, 'utf8');
  assert.ok(guideContent.includes('Zero Fabricated Inventory'), 'Guide must mandate zero fabricated inventory');
  assert.ok(guideContent.includes('IRCTC'), 'Guide must detail train provider requirements');
  assert.ok(guideContent.includes('RedBus'), 'Guide must detail bus provider requirements');
  assert.ok(guideContent.includes('Fail-Closed'), 'Guide must mandate fail-closed key architecture');
  console.log('✓ Test 2 Passed: docs/PROVIDER_INTEGRATION_GUIDE.md verified.\n');

  // Test 3: Step 81 Fail-Closed Provider Key Architecture for Flights
  console.log('Test 3: Verify flights fail closed when SerpAPI key is unavailable or unconfigured');
  const originalSerpKey = process.env.SERPAPI_KEY;
  try {
    delete process.env.SERPAPI_KEY;
    const flightEnvelope = await searchFlightsWithSerpApi({
      origin: 'Mumbai',
      destination: 'Delhi',
      outboundDate: '2026-11-01',
      travelers: 1,
      cabinClass: 'Economy',
      currency: 'INR',
    });
    assert.strictEqual(flightEnvelope.status, 'UNAVAILABLE', 'Must return UNAVAILABLE status when key is missing');
    assert.strictEqual(flightEnvelope.results.length, 0, 'Must return 0 results when unavailable');
    assert.ok(flightEnvelope.notice?.includes('unavailable') || flightEnvelope.notice?.includes('unconfigured'), 'Must return helpful unavailable notice');
  } finally {
    if (originalSerpKey !== undefined) {
      process.env.SERPAPI_KEY = originalSerpKey;
    }
  }
  console.log('✓ Test 3 Passed: Flights provider fails closed safely.\n');

  // Test 4: Step 81 Fail-Closed Provider Key Architecture for Stays
  console.log('Test 4: Verify hotels fail closed when SerpAPI key is unavailable or unconfigured');
  try {
    delete process.env.SERPAPI_KEY;
    const stayEnvelope = await searchHotelsWithSerpApi({
      destination: 'Goa',
      checkIn: '2026-11-01',
      checkOut: '2026-11-04',
      guests: 2,
      rooms: 1,
      currency: 'INR',
    });
    assert.strictEqual(stayEnvelope.status, 'UNAVAILABLE', 'Must return UNAVAILABLE status when key is missing');
    assert.strictEqual(stayEnvelope.results.length, 0, 'Must return 0 results when unavailable');
    assert.ok(stayEnvelope.notice?.includes('unavailable') || stayEnvelope.notice?.includes('unconfigured'), 'Must return helpful unavailable notice');
  } finally {
    if (originalSerpKey !== undefined) {
      process.env.SERPAPI_KEY = originalSerpKey;
    }
  }
  console.log('✓ Test 4 Passed: Stays provider fails closed safely.\n');

  // Test 5: Step 81 Fail-Closed Provider Key Architecture for Gemini Chat
  console.log('Test 5: Verify Gemini chat assistant fails closed when GEMINI_API_KEY is missing');
  const originalGeminiKey = process.env.GEMINI_API_KEY;
  try {
    delete process.env.GEMINI_API_KEY;
    const chatResult = await generateGeminiChatReply(
      [{ role: 'user', content: 'Plan a trip to Goa' }],
      {}
    );
    assert.strictEqual(chatResult, null, 'Must return null without attempting network request when key is missing');
  } finally {
    if (originalGeminiKey !== undefined) {
      process.env.GEMINI_API_KEY = originalGeminiKey;
    }
  }
  console.log('✓ Test 5 Passed: Gemini Chat assistant fails closed safely.\n');

  console.log('================================================================');
  console.log('🎉 ALL PHASE 10 CAPABILITY MANAGEMENT AUDIT TESTS PASSED!');
  console.log('================================================================\n');
}

runPhase10Audit().catch((err) => {
  console.error('Phase 10 audit failed:', err);
  process.exit(1);
});
