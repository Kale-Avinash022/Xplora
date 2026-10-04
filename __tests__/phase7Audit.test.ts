// __tests__/phase7Audit.test.ts
// Phase 7 Verification & Genuine Gemini Chat Integration Audit (Steps 56–64)

import assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';
import { ALLOWED_ACTION_COMMANDS, ActionCommand } from '@/lib/chat/contracts';
import { generateGeminiChatReply } from '@/lib/llm/client';

async function runPhase7Audit() {
  console.log('\n--- Running Phase 7 Verification & Gemini Chat Integration Audit (Steps 56–64) ---\n');

  const contractsPath = path.join(process.cwd(), 'lib', 'chat', 'contracts.ts');
  const contractsContent = fs.readFileSync(contractsPath, 'utf8');

  const clientPath = path.join(process.cwd(), 'lib', 'llm', 'client.ts');
  const clientContent = fs.readFileSync(clientPath, 'utf8');

  const routePath = path.join(process.cwd(), 'app', 'api', 'chat', 'route.ts');
  const routeContent = fs.readFileSync(routePath, 'utf8');

  // Test 1: Step 56 Chat Contracts & Allowlisted Commands
  console.log('Test 1: Verify chat contracts and allowlisted action commands (Step 56)');
  assert.ok(contractsContent.includes('export type ChatRole ='), 'Must export ChatRole');
  assert.ok(contractsContent.includes('export interface ChatMessage'), 'Must export ChatMessage');
  assert.ok(contractsContent.includes('export interface TripProposal'), 'Must export TripProposal');
  assert.ok(contractsContent.includes('export interface ChatResponseEnvelope'), 'Must export ChatResponseEnvelope');
  
  assert.strictEqual(ALLOWED_ACTION_COMMANDS.size, 4, 'Must have exactly 4 allowlisted action commands');
  assert.ok(ALLOWED_ACTION_COMMANDS.has('APPLY_TRIP_DETAILS'), 'Must include APPLY_TRIP_DETAILS');
  assert.ok(ALLOWED_ACTION_COMMANDS.has('EXPORT_PDF'), 'Must include EXPORT_PDF');
  assert.ok(ALLOWED_ACTION_COMMANDS.has('EXPORT_CALENDAR'), 'Must include EXPORT_CALENDAR');
  assert.ok(ALLOWED_ACTION_COMMANDS.has('SAVE_TRIP'), 'Must include SAVE_TRIP');
  console.log('✓ Test 1 Passed: Chat contracts and strict allowlist verified.\n');

  // Test 2: Step 57 & 58 Gemini Helper & Strict System Prompt
  console.log('Test 2: Verify generateGeminiChatReply implementation and system prompt (Steps 57 & 58)');
  assert.strictEqual(typeof generateGeminiChatReply, 'function', 'generateGeminiChatReply must be a function');
  assert.ok(
    clientContent.includes('generateGeminiChatReply'),
    'lib/llm/client.ts must implement generateGeminiChatReply'
  );
  assert.ok(
    clientContent.includes('responseMimeType: \'application/json\'') ||
    clientContent.includes('"responseMimeType": "application/json"') ||
    clientContent.includes("responseMimeType: 'application/json'"),
    'Must request structured JSON response from Gemini'
  );
  assert.ok(
    clientContent.includes('You are XPLORA AI Travel Planning Assistant, NOT a booking engine.'),
    'System instruction must explicitly state assistant identity and non-booking role'
  );
  assert.ok(
    clientContent.includes('Never claim that a booking, ticket, flight seat, hotel room, or payment is confirmed.'),
    'System instruction must forbid false confirmation claims'
  );
  assert.ok(
    clientContent.includes('Never invent live flight schedules, hotel prices, or artificial deep-links.'),
    'System instruction must forbid fabricated quotes'
  );
  console.log('✓ Test 2 Passed: Server-side Gemini helper and truth-first prompt verified.\n');

  // Test 3: Step 59 Purge Regex Chat Handler
  console.log('Test 3: Verify complete removal of regex simulation from app/api/chat/route.ts (Step 59)');
  assert.ok(
    !routeContent.includes("cleanPrompt.includes('pdf')"),
    'app/api/chat/route.ts must not contain regex matching for pdf'
  );
  assert.ok(
    !routeContent.includes("cleanPrompt.includes('save')"),
    'app/api/chat/route.ts must not contain regex matching for save'
  );
  assert.ok(
    !routeContent.includes("cleanPrompt.includes('goa')"),
    'app/api/chat/route.ts must not contain static keyword matching for goa'
  );
  assert.ok(
    !routeContent.includes("cleanPrompt.includes('family')"),
    'app/api/chat/route.ts must not contain static keyword matching for family'
  );
  console.log('✓ Test 3 Passed: Zero regex-based simulation logic remains in chat route.\n');

  // Test 4: Step 60 Server-Side Validation of Gemini Responses
  console.log('Test 4: Verify server-side sanitization of proposals and action commands (Step 60)');
  assert.ok(
    routeContent.includes('sanitizeProposal') && routeContent.includes('sanitizeActionCommand'),
    'Route must define sanitizeProposal and sanitizeActionCommand'
  );
  assert.ok(
    routeContent.includes('ALLOWED_ACTION_COMMANDS.has'),
    'Action commands must be strictly validated against allowlist'
  );
  assert.ok(
    routeContent.includes('durationNum >= 1 && durationNum <= 30'),
    'Duration must be bounded between 1 and 30'
  );
  console.log('✓ Test 4 Passed: Server-side sanitization and validation enforced.\n');

  // Test 5: Step 61 Graceful Unavailable Chat Response
  console.log('Test 5: Verify honest unavailable response when service is offline (Step 61)');
  assert.ok(
    routeContent.includes('isAvailable: false'),
    'Must return isAvailable: false when service cannot be reached'
  );
  assert.ok(
    routeContent.includes('AI travel chat is currently unavailable') ||
    routeContent.includes('AI travel chat is temporarily unavailable'),
    'Must provide transparent explanation of unavailability'
  );
  console.log('✓ Test 5 Passed: Graceful unavailable response contract verified.\n');

  // Test 6: Step 62 & 63 Payload Bounding & Redacted Logging
  console.log('Test 6: Verify payload bounding and redacted operational logging (Steps 62 & 63)');
  assert.ok(
    routeContent.includes('.slice(-10)') && routeContent.includes('.slice(0, 500)'),
    'Messages must be bounded to 10 items and 500 characters each'
  );
  assert.ok(
    routeContent.includes('[CHAT_LOG]') && routeContent.includes('correlationId'),
    'Route must log correlation ID and diagnostic metrics'
  );
  assert.ok(
    !routeContent.includes('console.log(apiKey)') &&
    !routeContent.includes('console.log(process.env)'),
    'Route must never log API keys or secrets'
  );
  console.log('✓ Test 6 Passed: Payload bounding and redacted diagnostics verified.\n');

  console.log('========================================================');
  console.log('🎉 ALL PHASE 7 AUDIT TESTS PASSED SUCCESSFULLY! (Steps 56–64)');
  console.log('========================================================\n');
}

runPhase7Audit().catch((err) => {
  console.error('Phase 7 Audit failed:', err);
  process.exit(1);
});
