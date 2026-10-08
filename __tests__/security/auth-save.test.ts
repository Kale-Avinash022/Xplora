// __tests__/security/auth-save.test.ts
// Step 89: Itinerary Save Security Tests

import assert from 'node:assert';
import { GET, POST } from '../../app/api/itineraries/route';
import { prisma } from '../../lib/prisma';

async function runAuthSaveSecurityTests() {
  console.log('\n--- Running Step 89: Itinerary Save Security Tests ---\n');

  // Test 1: POST /api/itineraries rejects unauthenticated requests
  const unauthReq = new Request('http://localhost:3000/api/itineraries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Unauthenticated Trip',
      destination: 'Goa',
      durationDays: 3,
      budget: 25000,
      dayPlans: [],
    }),
  });
  const unauthRes = await POST(unauthReq);
  assert.strictEqual(unauthRes.status, 401, 'POST without session must return 401');

  // Test 2: POST /api/itineraries ignores spoofed userId in body
  const spoofedReq = new Request('http://localhost:3000/api/itineraries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Spoofed Admin Trip',
      destination: 'Goa',
      durationDays: 3,
      budget: 25000,
      userId: 'admin_victim_id',
      dayPlans: [],
    }),
  });
  const spoofedRes = await POST(spoofedReq);
  assert.strictEqual(spoofedRes.status, 401, 'POST with spoofed body userId must still return 401');

  // Test 3: GET /api/itineraries rejects unauthenticated enumeration attempt
  const unauthGetReq = new Request('http://localhost:3000/api/itineraries?userId=target_user_id', {
    method: 'GET',
  });
  const unauthGetRes = await GET(unauthGetReq);
  assert.strictEqual(unauthGetRes.status, 401, 'GET without session must return 401 regardless of query parameter');

  // Test 4: Authenticated user saves under their own ID, ignoring body spoofing
  let user1 = await prisma.user.findFirst();
  if (!user1) {
    user1 = await prisma.user.create({
      data: {
        name: 'User One',
        email: 'user1_save_sec@xplora.ai',
        password: 'secure_password_hash_1',
      },
    });
  }

  const authPostReq = new Request('http://localhost:3000/api/itineraries', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: `xplora_user=${encodeURIComponent(JSON.stringify({ id: user1.id, name: user1.name, email: user1.email }))}`,
    },
    body: JSON.stringify({
      title: 'User 1 Secure Trip',
      destination: 'Kerala',
      durationDays: 3,
      budget: 20000,
      userId: 'attacker_stolen_id_attempt',
      dayPlans: [
        {
          dayNumber: 1,
          summary: 'Kochi Fort',
          activities: [
            {
              timeSlot: 'Morning',
              title: 'Sightseeing',
              description: 'Fort Kochi walk',
              cost: 100,
              location: 'Kochi',
            },
          ],
        },
      ],
    }),
  });

  const authPostRes = await POST(authPostReq);
  assert.strictEqual(authPostRes.status, 201, 'Authenticated save must return 201');
  const authPostData = await authPostRes.json();
  assert.strictEqual(
    authPostData.itinerary.userId,
    user1.id,
    'Itinerary must be saved under session owner, ignoring body.userId'
  );

  console.log('✓ All Itinerary Save Security tests passed successfully!\n');
}

runAuthSaveSecurityTests().catch((err) => {
  console.error('Itinerary save security tests failed:', err);
  process.exit(1);
});
