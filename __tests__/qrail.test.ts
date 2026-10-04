// __tests__/qrail.test.ts
// Comprehensive Test Suite for Qrail Railway Provider Integration

import { resolveStationCode, getStationName } from '../lib/travel/providers/qrail/stations';
import { validateTrainQuery } from '../lib/travel/validation';
import { normalizeQrailTrain, getTimeOfDay, formatDuration, mapClasses } from '../lib/travel/providers/qrail/mapper';
import { QrailClient, QrailApiError, sanitizeUrlForLog } from '../lib/travel/providers/qrail/client';
import { searchTrainsWithQrail, generateTrainCacheKey } from '../lib/travel/providers/qrail/service';
import { GET, POST } from '../app/api/trains/route';
import { TrainSearchRequest, TravelSearchEnvelope, TrainOption } from '../lib/types';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    testsPassed++;
    console.log(`  ✓ ${message}`);
  } else {
    testsFailed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function runQrailTestSuite() {
  console.log('================================================================');
  console.log('  RUNNING QRAIL RAILWAY PROVIDER INTEGRATION TEST SUITE');
  console.log('================================================================\n');

  // -------------------------------------------------------------------------
  // 1. Station Code Resolution
  // -------------------------------------------------------------------------
  console.log('Test Group 1: Station Code & City Mapping Resolution');

  assert(resolveStationCode('NGP') === 'NGP', 'Direct station code "NGP" resolves to NGP');
  assert(resolveStationCode('NDLS') === 'NDLS', 'Direct station code "NDLS" resolves to NDLS');
  assert(resolveStationCode('CSMT') === 'CSMT', 'Direct station code "CSMT" resolves to CSMT');
  assert(resolveStationCode('PUNE') === 'PUNE', 'Direct station code "PUNE" resolves to PUNE');
  assert(resolveStationCode('MAO') === 'MAO', 'Direct station code "MAO" resolves to MAO');

  assert(resolveStationCode('Nagpur') === 'NGP', 'City name "Nagpur" resolves to NGP');
  assert(resolveStationCode('mumbai') === 'CSMT', 'City name "mumbai" resolves to CSMT');
  assert(resolveStationCode('New Delhi') === 'NDLS', 'City name "New Delhi" resolves to NDLS');
  assert(resolveStationCode('Pune') === 'PUNE', 'City name "Pune" resolves to PUNE');
  assert(resolveStationCode('Bangalore') === 'SBC', 'City name "Bangalore" resolves to SBC');
  assert(resolveStationCode('Goa') === 'MAO', 'City name "Goa" resolves to MAO');

  assert(resolveStationCode('Nagpur (NGP)') === 'NGP', 'Parenthetical string "Nagpur (NGP)" resolves to NGP');
  assert(resolveStationCode('Delhi, India') === 'NDLS', 'City prefix "Delhi, India" resolves to NDLS');
  assert(resolveStationCode('UnknownCity1234') === null, 'Unknown city returns null without guessing');

  assert(getStationName('NGP').includes('Nagpur'), 'getStationName("NGP") returns human name containing Nagpur');
  assert(getStationName('NDLS').includes('New Delhi'), 'getStationName("NDLS") returns human name containing New Delhi');
  console.log();

  // -------------------------------------------------------------------------
  // 2. Train Query Validation
  // -------------------------------------------------------------------------
  console.log('Test Group 2: Train Search Query Validation');

  const validQuery: Partial<TrainSearchRequest> = {
    origin: 'Nagpur',
    destination: 'Pune',
    date: '2026-12-15',
    travelers: 2,
  };
  const validRes = validateTrainQuery(validQuery);
  assert(validRes.isValid === true, 'Valid query passes validation');
  assert(validRes.data?.origin === 'Nagpur', 'Normalized origin is preserved');
  assert(validRes.data?.quota === 'GN', 'Default quota GN is assigned');

  const missingDest = validateTrainQuery({ origin: 'NGP', date: '2026-12-15' });
  assert(missingDest.isValid === false, 'Missing destination is caught');
  assert(Boolean(missingDest.errors.destination), 'Destination field error provided');

  const sameStations = validateTrainQuery({ origin: 'NGP', destination: 'NGP', date: '2026-12-15' });
  assert(sameStations.isValid === false, 'Same origin and destination is rejected');

  const pastDate = validateTrainQuery({ origin: 'NGP', destination: 'PUNE', date: '2020-01-01' });
  assert(pastDate.isValid === false, 'Past date is rejected');
  console.log();

  // -------------------------------------------------------------------------
  // 3. Normalization & Mapping
  // -------------------------------------------------------------------------
  console.log('Test Group 3: Qrail Payload Normalization & Mapping');

  assert(getTimeOfDay('06:30') === 'Morning', '06:30 mapped to Morning');
  assert(getTimeOfDay('14:15') === 'Afternoon', '14:15 mapped to Afternoon');
  assert(getTimeOfDay('19:45') === 'Evening', '19:45 mapped to Evening');
  assert(getTimeOfDay('23:10') === 'Night', '23:10 mapped to Night');

  assert(formatDuration('14:30') === '14h 30m', 'Duration "14:30" formatted to "14h 30m"');
  assert(formatDuration('120') === '2h 0m', 'Numeric duration 120 formatted to "2h 0m"');

  const rawQrailItem = {
    train_number: '12136',
    train_name: 'NAGPUR - PUNE SF Express',
    from_station_code: 'NGP',
    to_station_code: 'PUNE',
    departure_time: '18:00',
    arrival_time: '09:05',
    duration: '15:05',
    classes: [
      { class_code: '2A', fare: 1850, seats: 24, status: 'AVAILABLE' },
      { class_code: '3A', fare: 1300, seats: 52, status: 'AVAILABLE' },
      { class_code: 'SL', fare: 485, seats: 'WL 12', status: 'WL' },
    ],
    run_days: ['Mon', 'Wed', 'Sat'],
  };

  const normalized = normalizeQrailTrain(rawQrailItem as any, 0, '2026-12-15');
  assert(normalized.trainNumber === '12136', 'Train number correctly mapped');
  assert(normalized.trainName === 'NAGPUR - PUNE SF Express', 'Train name correctly mapped');
  assert(normalized.departureStation === 'NGP', 'Departure station correctly mapped');
  assert(normalized.arrivalStation === 'PUNE', 'Arrival station correctly mapped');
  assert(normalized.departureTime === '18:00', 'Departure time correctly mapped');
  assert(normalized.arrivalTime === '09:05', 'Arrival time correctly mapped');
  assert(normalized.duration === '15h 5m', 'Duration correctly formatted');
  assert(normalized.timeOfDay === 'Evening', 'Departure 18:00 classified as Evening');
  assert(normalized.classes.length === 3, 'All 3 classes parsed');
  assert(normalized.price === 485, 'Lowest fare (485) selected as starting price');
  assert(normalized.bookingUrl === 'https://www.irctc.co.in/nget/train-search', 'IRCTC verified booking URL assigned');
  console.log();

  // -------------------------------------------------------------------------
  // 4. Security & Sanitization
  // -------------------------------------------------------------------------
  console.log('Test Group 4: Security, Credential Redaction & Client Safety');

  const dirtyUrl = 'https://api.qrail.in/api/v1/trains/between?from=NDLS&to=BCT&api_key=SECRET_TOKEN_123';
  const cleanUrl = sanitizeUrlForLog(dirtyUrl);
  assert(!cleanUrl.includes('SECRET_TOKEN_123'), 'Sanitizer strips sensitive API key from logs');
  assert(cleanUrl.includes('api_key=REDACTED'), 'Sanitizer replaces token with REDACTED');

  const authError = new QrailApiError('Access denied', 403, 'API access disabled');
  assert(authError.isAuthError === true, '403 correctly classified as isAuthError');
  assert(authError.qrailMessage === 'API access disabled', 'qrailMessage preserved');

  const rateLimitError = new QrailApiError('Too Many Requests', 429);
  assert(rateLimitError.isRateLimited === true, '429 correctly classified as isRateLimited');

  const serverError = new QrailApiError('Gateway Error', 502);
  assert(serverError.isDownstreamError === true, '502 correctly classified as isDownstreamError');
  console.log();

  // -------------------------------------------------------------------------
  // 5. Service Orchestration & Truthful Fallbacks
  // -------------------------------------------------------------------------
  console.log('Test Group 5: Service Orchestration & Truthful Fallbacks');

  // Test invalid station in service
  const unresolvableServiceRes = await searchTrainsWithQrail({
    origin: 'XYZNonExistentCity',
    destination: 'PUNE',
    date: '2026-12-15',
  });
  assert(unresolvableServiceRes.status === 'INVALID_REQUEST', 'Service returns INVALID_REQUEST for unknown origin');
  assert(Boolean(unresolvableServiceRes.fieldErrors?.origin), 'Service provides fieldError for origin');

  // Test same station in service
  const sameStationServiceRes = await searchTrainsWithQrail({
    origin: 'PUNE',
    destination: 'PUNE',
    date: '2026-12-15',
  });
  assert(sameStationServiceRes.status === 'INVALID_REQUEST', 'Service returns INVALID_REQUEST for identical stations');

  // Test live search with configured key (which currently returns 403 "API access disabled")
  const liveRes = await searchTrainsWithQrail({
    origin: 'Nagpur',
    destination: 'Pune',
    date: '2026-12-15',
  }, { bypassCache: true });

  // Truthfulness check: Since Qrail returned 403 "API access disabled", service must honestly report UNAVAILABLE
  assert(liveRes.status === 'UNAVAILABLE' || liveRes.status === 'LIVE', 'Live provider call handled truthfully');
  if (liveRes.status === 'UNAVAILABLE') {
    assert(
      Boolean(liveRes.notice?.includes('restricted') || liveRes.notice?.includes('disabled') || liveRes.notice?.includes('unavailable')),
      'Honest diagnostic notice returned to user without leaking credentials'
    );
    assert(liveRes.results.length === 0, 'No synthetic or fabricated trains returned');
  }
  console.log();

  // -------------------------------------------------------------------------
  // 6. API Route Handlers (/api/trains)
  // -------------------------------------------------------------------------
  console.log('Test Group 6: API Route Handlers (/api/trains)');

  // GET with missing params -> HTTP 400
  const reqGetInvalid = new Request('http://localhost:3000/api/trains?from=NGP');
  const resGetInvalid = await GET(reqGetInvalid);
  assert(resGetInvalid.status === 400, 'GET /api/trains with missing params returns HTTP 400');
  const bodyGetInvalid = await resGetInvalid.json();
  assert(bodyGetInvalid.status === 'INVALID_REQUEST', 'Response payload contains status INVALID_REQUEST');

  // GET with unsupported station -> HTTP 422
  const reqGetUnsupported = new Request('http://localhost:3000/api/trains?from=NGP&to=UnknownTown999&date=2026-12-15');
  const resGetUnsupported = await GET(reqGetUnsupported);
  assert(resGetUnsupported.status === 422, 'GET /api/trains with unknown station returns HTTP 422');

  // POST with valid request -> executes search and returns truthful status
  const reqPost = new Request('http://localhost:3000/api/trains', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'NGP',
      to: 'PUNE',
      date: '2026-12-15',
    }),
  });
  const resPost = await POST(reqPost);
  assert(resPost.status === 200 || resPost.status === 503, 'POST /api/trains returns 200 (live) or 503 (provider restricted)');
  const bodyPost = await resPost.json();
  assert(Array.isArray(bodyPost.trains), 'Response contains trains array alias');
  assert(Array.isArray(bodyPost.results), 'Response contains results array');
  console.log();

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('================================================================');
  console.log(`  QRAIL TEST SUITE RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('================================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runQrailTestSuite().catch((err) => {
  console.error('Fatal error in Qrail test runner:', err);
  process.exit(1);
});
