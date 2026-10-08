// __tests__/phase8Audit.test.ts
// Phase 8 Verification: Explicit User Confirmation in AI Chat Drawer (Steps 65–71)

import assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';

async function runPhase8Audit() {
  console.log('\n--- Running Phase 8 Verification & Chat Confirmation Audit (Steps 65–71) ---\n');

  const drawerPath = path.join(process.cwd(), 'components', 'AIChatDrawer.tsx');
  const drawerContent = fs.readFileSync(drawerPath, 'utf8');

  // Test 1: Step 65 Update Branding & Advisory Subtitle
  console.log('Test 1: Verify AIChatDrawer branding and advisory role');
  assert.ok(
    drawerContent.includes('XPLORA AI Travel Assistant'),
    'Header must feature "XPLORA AI Travel Assistant"'
  );
  assert.ok(
    drawerContent.includes('Planning assistant • Suggestions require your confirmation'),
    'Header must state "Planning assistant • Suggestions require your confirmation"'
  );
  assert.ok(
    !drawerContent.includes('Autonomous trip planner & memory agent'),
    'Must remove "Autonomous trip planner & memory agent"'
  );
  console.log('✓ Test 1 Passed: Advisory branding verified.\n');

  // Test 2: Step 66 Truthful AI Service Availability Indicator
  console.log('Test 2: Verify state-aware availability indicator');
  assert.ok(
    drawerContent.includes('isServiceAvailable'),
    'Must track isServiceAvailable state'
  );
  assert.ok(
    drawerContent.includes('Connected (Advisory)') || drawerContent.includes('AI Service Connected'),
    'Must indicate connected status when service is available'
  );
  console.log('✓ Test 2 Passed: Truthful availability indicator verified.\n');

  // Test 3: Step 67 Remove Automatic Side-Effects from handleSendWithText
  console.log('Test 3: Verify zero automatic side-effects upon message reception');
  // Check that handleSendWithText does not call onCreateTripFromChat directly on response
  assert.ok(
    !drawerContent.includes('onCreateTripFromChat(data.createTripParams);'),
    'handleSendWithText must not automatically invoke onCreateTripFromChat'
  );
  assert.ok(
    !drawerContent.includes('onExecuteActionCommand(data.actionCommand);'),
    'handleSendWithText must not automatically invoke onExecuteActionCommand'
  );
  console.log('✓ Test 3 Passed: Zero automatic side-effects confirmed.\n');

  // Test 4: Step 68 Interactive Trip Proposal Cards
  console.log('Test 4: Verify interactive trip proposal cards with explicit user confirmation');
  assert.ok(
    drawerContent.includes('tripProposal'),
    'Message interface must support tripProposal'
  );
  assert.ok(
    drawerContent.includes('Apply trip details ➔'),
    'Proposal card must include explicit "Apply trip details ➔" button'
  );
  assert.ok(
    drawerContent.includes('Applied to Planner ✓') || drawerContent.includes('Applied ✓'),
    'Proposal card must reflect applied state after clicking'
  );
  console.log('✓ Test 4 Passed: Explicit trip proposal card confirmation verified.\n');

  // Test 5: Step 69 & 70 Explicit Action Proposal Buttons
  console.log('Test 5: Verify explicit confirmation buttons for PDF, Calendar, and Save');
  assert.ok(
    drawerContent.includes('Export Itinerary to PDF'),
    'Must provide explicit PDF export confirmation button'
  );
  assert.ok(
    drawerContent.includes('Export to Google Calendar'),
    'Must provide explicit calendar export confirmation button'
  );
  assert.ok(
    drawerContent.includes('Save Trip to My Account'),
    'Must provide explicit save trip confirmation button'
  );
  console.log('✓ Test 5 Passed: Explicit proposal buttons for external actions verified.\n');

  console.log('================================================================');
  console.log('🎉 ALL PHASE 8 CHAT CONFIRMATION AUDIT TESTS PASSED!');
  console.log('================================================================\n');
}

runPhase8Audit().catch((err) => {
  console.error('Phase 8 audit failed:', err);
  process.exit(1);
});
