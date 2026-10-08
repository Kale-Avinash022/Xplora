// __tests__/phase9Audit.test.ts
// Phase 9 Verification: Itinerary Save Security & Session Hardening (Steps 72–77)

import assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';
import { getAuthenticatedUser } from '../lib/auth/session';
import { GET, POST } from '../app/api/itineraries/route';
import { prisma } from '../lib/prisma';

async function runPhase9Audit() {
  console.log('\n--- Running Phase 9 Verification & Itinerary Save Security Audit (Steps 72–77) ---\n');

  const sessionPath = path.join(process.cwd(), 'lib', 'auth', 'session.ts');
  const sessionContent = fs.readFileSync(sessionPath, 'utf8');

  const routePath = path.join(process.cwd(), 'app', 'api', 'itineraries', 'route.ts');
  const routeContent = fs.readFileSync(routePath, 'utf8');

  const pagePath = path.join(process.cwd(), 'app', 'page.tsx');
  const pageContent = fs.readFileSync(pagePath, 'utf8');

  // Test 1: Step 72 Audit Itinerary Save Endpoint Body Parsing
  console.log('Test 1: Verify request body userId parameter is excluded / ignored');
  assert.ok(
    !routeContent.includes('const { title, destination, durationDays, budget, currency = \'INR\', travelStyle = \'General\', userId, dayPlans } = body;'),
    'app/api/itineraries/route.ts POST handler must NOT extract userId from body'
  );
  assert.ok(
    routeContent.includes('getAuthenticatedUser'),
    'app/api/itineraries/route.ts must import and call getAuthenticatedUser'
  );
  console.log('✓ Test 1 Passed: Client-supplied userId is excluded from body parsing.\n');

  // Test 2: Step 73 Server-Side Session Helper
  console.log('Test 2: Verify getAuthenticatedUser session helper in lib/auth/session.ts');
  assert.strictEqual(typeof getAuthenticatedUser, 'function', 'getAuthenticatedUser must be exported as a function');
  assert.ok(
    sessionContent.includes('prisma.user.findUnique'),
    'getAuthenticatedUser must verify identity against the database'
  );
  
  // Unauthenticated request test
  const emptyReq = new Request('http://localhost:3000/api/itineraries', { method: 'GET' });
  const noUser = await getAuthenticatedUser(emptyReq);
  assert.strictEqual(noUser, null, 'Unauthenticated request must return null');

  // Spoofed fake user cookie test
  const fakeCookieReq = new Request('http://localhost:3000/api/itineraries', {
    method: 'GET',
    headers: {
      cookie: `xplora_user=${encodeURIComponent(JSON.stringify({ id: 'non_existent_fake_user_id', name: 'Fake' }))}`,
    },
  });
  const fakeUser = await getAuthenticatedUser(fakeCookieReq);
  assert.strictEqual(fakeUser, null, 'Cookie with non-existent user ID in DB must return null');
  console.log('✓ Test 2 Passed: Server-side session verification helper is secure.\n');

  // Test 3: Step 74 Refactor POST Handler
  console.log('Test 3: Verify POST /api/itineraries rejects unauthenticated and spoofed requests');
  const unauthPostReq = new Request('http://localhost:3000/api/itineraries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Hacked Trip',
      destination: 'Goa',
      durationDays: 3,
      budget: 20000,
      userId: 'admin_spoofed_id',
      dayPlans: [],
    }),
  });
  const unauthPostRes = await POST(unauthPostReq);
  assert.strictEqual(unauthPostRes.status, 401, 'POST without valid session must return HTTP 401');
  const unauthPostData = await unauthPostRes.json();
  assert.ok(
    unauthPostData.error?.includes('Authentication required'),
    'Error message must state authentication is required'
  );
  console.log('✓ Test 3 Passed: POST /api/itineraries strictly requires authenticated session.\n');

  // Test 4: Step 75 Refactor GET Handler
  console.log('Test 4: Verify GET /api/itineraries derives user from session and rejects enumeration');
  assert.ok(
    !routeContent.includes("searchParams.get('userId')"),
    'GET handler must NOT read userId from searchParams'
  );
  
  const unauthGetReq = new Request('http://localhost:3000/api/itineraries?userId=victim_user_123', {
    method: 'GET',
  });
  const unauthGetRes = await GET(unauthGetReq);
  assert.strictEqual(unauthGetRes.status, 401, 'GET without valid session must return HTTP 401');
  console.log('✓ Test 4 Passed: GET /api/itineraries derives querying user strictly from session.\n');

  // Test 5: Step 76 Client-Side Save Flow & Error Messaging
  console.log('Test 5: Verify client-side save flow in app/page.tsx');
  assert.ok(
    pageContent.includes('!data.itinerary?.id'),
    'Client save flow must verify data.itinerary?.id before confirming save'
  );
  assert.ok(
    pageContent.includes('Session expired or required'),
    'Client save flow must display session expiry / required notice'
  );
  console.log('✓ Test 5 Passed: Truthful client save verification confirmed.\n');

  // Test 6: Authenticated End-to-End Save with Valid User
  console.log('Test 6: Verify end-to-end itinerary save under verified session');
  // Find or create a test user
  let testUser = await prisma.user.findFirst();
  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        name: 'Session Test User',
        email: 'session_test@xplora.ai',
        password: 'hashed_test_password_123',
      },
    });
  }

  const authPostReq = new Request('http://localhost:3000/api/itineraries', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: `xplora_user=${encodeURIComponent(JSON.stringify({ id: testUser.id, name: testUser.name, email: testUser.email }))}`,
    },
    body: JSON.stringify({
      title: 'Verified Goa Vacation',
      destination: 'Goa',
      durationDays: 2,
      budget: 15000,
      currency: 'INR',
      travelStyle: 'Relaxation',
      // Intentionally pass a spoofed userId in body to prove server ignores it
      userId: 'spoofed_different_user',
      dayPlans: [
        {
          dayNumber: 1,
          summary: 'Arrival and Beach Walk',
          activities: [
            {
              timeSlot: 'Morning',
              title: 'Check into resort',
              description: 'Settle in and relax',
              cost: 0,
              location: 'Calangute',
            },
          ],
        },
      ],
    }),
  });

  const authPostRes = await POST(authPostReq);
  assert.strictEqual(authPostRes.status, 201, 'POST with valid session must return HTTP 201');
  const authPostData = await authPostRes.json();
  assert.ok(authPostData.itinerary?.id, 'Response must return saved itinerary with id');
  assert.strictEqual(
    authPostData.itinerary.userId,
    testUser.id,
    'Itinerary must be saved under session user id, completely ignoring spoofed body userId'
  );

  // Now test GET with the authenticated user session
  const authGetReq = new Request('http://localhost:3000/api/itineraries', {
    method: 'GET',
    headers: {
      cookie: `xplora_user=${encodeURIComponent(JSON.stringify({ id: testUser.id, name: testUser.name, email: testUser.email }))}`,
    },
  });
  const authGetRes = await GET(authGetReq);
  assert.strictEqual(authGetRes.status, 200, 'GET with valid session must return HTTP 200');
  const authGetData = await authGetRes.json();
  assert.ok(Array.isArray(authGetData), 'Response must be an array of itineraries');
  const foundSaved = authGetData.some((it: any) => it.id === authPostData.itinerary.id);
  assert.ok(foundSaved, 'Saved itinerary must be present in session user itinerary list');

  console.log('✓ Test 6 Passed: End-to-end authenticated save and fetch verified.\n');

  console.log('================================================================');
  console.log('🎉 ALL PHASE 9 ITINERARY SAVE SECURITY AUDIT TESTS PASSED!');
  console.log('================================================================\n');
}

runPhase9Audit().catch((err) => {
  console.error('Phase 9 audit failed:', err);
  process.exit(1);
});
