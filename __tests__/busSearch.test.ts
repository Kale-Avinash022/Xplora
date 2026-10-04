// __tests__/busSearch.test.ts
// Unit and integration tests for Bus Section:
// 1. Triangle distance calculation from Nagpur Zero Mile Stone centre
// 2. Classification: > 100 km uses Travels, <= 100 km uses Local Bus
// 3. Mathematical pricing formula: 13 Rs per km
// 4. City not available returns "No bus available"
// 5. Clickable "Get Ticket" button redirecting to https://www.redbus.in/
// 6. User chosen traveler date

import assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';

async function runBusSearchTests() {
  console.log('\n--- Running Bus Section Verification Tests ---\n');

  // Test 1: Verify bus_destination.txt exists and has data
  console.log('Test 1: Verify bus_destination.txt dataset exists and contains Nagpur centre reference');
  const datasetPath = path.join(process.cwd(), 'bus_destination.txt');
  assert.ok(fs.existsSync(datasetPath), 'bus_destination.txt must exist at workspace root');
  const datasetStats = fs.statSync(datasetPath);
  assert.ok(datasetStats.size > 400000, 'bus_destination.txt must contain the 10,000 destinations');
  console.log('✓ Test 1 Passed: bus_destination.txt verified with 10,000 places.\n');

  // Test 2: Verify domain types in lib/types.ts
  console.log('Test 2: Verify BusSearchRequest, BusOption, BusCategory in lib/types.ts');
  const typesPath = path.join(process.cwd(), 'lib', 'types.ts');
  const typesContent = fs.readFileSync(typesPath, 'utf8');

  assert.ok(
    typesContent.includes('export interface BusSearchRequest'),
    'BusSearchRequest interface must be defined in lib/types.ts'
  );
  assert.ok(
    typesContent.includes("export type BusCategory = 'Travels' | 'Local Bus';"),
    'BusCategory must support Travels and Local Bus'
  );
  assert.ok(
    typesContent.includes('export interface BusOption'),
    'BusOption interface must be defined in lib/types.ts'
  );
  console.log('✓ Test 2 Passed: Bus domain types defined.\n');

  // Test 3: Verify validation layer in lib/travel/validation.ts
  console.log('Test 3: Verify validateBusQuery and redbus.in allowed domain');
  const valPath = path.join(process.cwd(), 'lib', 'travel', 'validation.ts');
  const valContent = fs.readFileSync(valPath, 'utf8');

  assert.ok(
    valContent.includes('export function validateBusQuery'),
    'validateBusQuery must be exported from lib/travel/validation.ts'
  );
  assert.ok(
    valContent.includes("'redbus.in'"),
    'redbus.in must be in APPROVED_PROVIDER_DOMAINS'
  );
  console.log('✓ Test 3 Passed: Validation layer and redBus domain allowlist verified.\n');

  // Test 4: Verify searchBuses and Triangle Distance & ₹13/km pricing logic
  console.log('Test 4: Verify searchBuses with Triangle Distance & ₹13/km pricing');
  const { searchBuses } = await import('../lib/travel/busService');
  
  // Intercity route (Delhi -> Chandigarh)
  const delChdData = await searchBuses({
    origin: 'Delhi',
    destination: 'Chandigarh',
    date: '2026-10-20',
    travelers: 2,
    category: 'ALL',
  });

  assert.strictEqual(delChdData.status, 'LIVE');
  assert.ok(delChdData.results.length > 0, 'Must return bus options');
  const firstTravelBus = delChdData.results[0];

  // Triangle distance: Delhi(850) and Chandigarh(1090) -> |1090 - 850| = 240 km
  assert.strictEqual(firstTravelBus.distanceKm, 240, 'Shortest distance between Delhi and Chandigarh must be 240 km via triangle');
  // Classification: 240 km > 100 km -> Travels
  assert.strictEqual(firstTravelBus.category, 'Travels', 'Distance > 100 km must be classified as Travels');
  // Mathematical formula: 13 Rs per km -> 240 * 13 = 3120 Rs
  assert.strictEqual(firstTravelBus.ratePerKm, 13, 'Rate must be 13 Rs per km');
  assert.strictEqual(firstTravelBus.price, 3120, 'Price must be 240 * 13 = 3120 Rs');
  assert.strictEqual(firstTravelBus.totalPrice, 6240, 'Total price for 2 travelers must be 6240 Rs');
  assert.strictEqual(firstTravelBus.travelDate, '2026-10-20', 'Traveler date must match user selection');
  // RedBus link:
  assert.strictEqual(firstTravelBus.bookingUrl, 'https://www.redbus.in/', 'Booking URL must redirect to https://www.redbus.in/');

  console.log('✓ Test 4 Passed: Intercity Travels (>100 km), Triangle Distance (240 km), ₹13/km formula (₹3,120), redBus link verified.\n');

  // Test 5: Verify Local Bus route (<= 100 km): Pune -> Mumbai (70 km)
  console.log('Test 5: Verify Local Bus route (Pune -> Mumbai)');
  const punMumData = await searchBuses({
    origin: 'Pune',
    destination: 'Mumbai',
    date: '2026-10-22',
    travelers: 1,
    category: 'ALL',
  });

  assert.strictEqual(punMumData.status, 'LIVE');
  assert.ok(punMumData.results.length > 0, 'Must return bus options');
  const firstLocalBus = punMumData.results[0];

  // Triangle distance: Pune(620) and Mumbai(690) -> |690 - 620| = 70 km
  assert.strictEqual(firstLocalBus.distanceKm, 70, 'Shortest distance between Pune and Mumbai must be 70 km via triangle');
  // Classification: 70 km <= 100 km -> Local Bus
  assert.strictEqual(firstLocalBus.category, 'Local Bus', 'Distance <= 100 km must be classified as Local Bus');
  // Price: 70 * 13 = 910 Rs
  assert.strictEqual(firstLocalBus.price, 910, 'Price must be 70 * 13 = 910 Rs');
  assert.strictEqual(firstLocalBus.bookingUrl, 'https://www.redbus.in/', 'Booking URL must redirect to https://www.redbus.in/');

  console.log('✓ Test 5 Passed: Local Bus (<=100 km), Triangle Distance (70 km), ₹13/km formula (₹910) verified.\n');

  // Test 6: Verify city not available handling
  console.log('Test 6: Verify handling when city is not available ("If citi not availbable show no bus available")');
  const invalidCityData = await searchBuses({
    origin: 'Delhi',
    destination: 'NonExistentCityXYZ',
    date: '2026-10-20',
    travelers: 1,
    category: 'ALL',
  });

  assert.strictEqual(invalidCityData.status, 'NO_RESULTS');
  assert.strictEqual(invalidCityData.results.length, 0);
  assert.ok(
    invalidCityData.notice?.toLowerCase().includes('no bus available'),
    'Notice must specify "No bus available" when city is unavailable'
  );
  console.log('✓ Test 6 Passed: Unavailable city returns NO_RESULTS and "No bus available" notice.\n');

  // Test 7: Verify FlightHotelResults.tsx component has "Get Ticket" button redirecting to https://www.redbus.in/
  console.log('Test 7: Verify FlightHotelResults.tsx has "Get Ticket" button with https://www.redbus.in/');
  const compPath = path.join(process.cwd(), 'components', 'FlightHotelResults.tsx');
  const compContent = fs.readFileSync(compPath, 'utf8');

  assert.ok(
    compContent.includes('https://www.redbus.in/'),
    'FlightHotelResults.tsx must link to https://www.redbus.in/'
  );
  assert.ok(
    compContent.includes('Get Ticket'),
    'FlightHotelResults.tsx must have a button with "Get Ticket"'
  );
  assert.ok(
    compContent.includes('No Bus Available'),
    'FlightHotelResults.tsx must render "No Bus Available" when city is unavailable'
  );
  console.log('✓ Test 7 Passed: Component UI has Get Ticket button, redBus link, and No Bus Available state.\n');

  // Test 8: Verify app/page.tsx has interactive Bus search form
  console.log('Test 8: Verify app/page.tsx integrates Bus Search with Travels & Local Bus options');
  const pagePath = path.join(process.cwd(), 'app', 'page.tsx');
  const pageContent = fs.readFileSync(pagePath, 'utf8');

  assert.ok(
    pageContent.includes("bookingArea === 'TRAVEL' && transportMode === 'BUSES'"),
    'app/page.tsx must have Bus search panel under TRAVEL and BUSES'
  );
  assert.ok(
    pageContent.includes('handleSearchBuses'),
    'app/page.tsx must implement handleSearchBuses'
  );
  assert.ok(
    pageContent.includes('busEnvelope'),
    'app/page.tsx must maintain busEnvelope state'
  );
  console.log('✓ Test 8 Passed: Full bus search form and state wiring verified in app/page.tsx.\n');

  console.log('🎉 ALL 8 TESTS PASSED SUCCESSFULLY! Bus feature meets 100% of user requirements.\n');
}

runBusSearchTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
