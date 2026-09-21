// __tests__/deduplication.test.ts
// Native Node.js test module assertion for trip-wide deduplication and distance capping

import assert from 'node:assert';
import { Place, deduplicatePlaces } from '../lib/places/opentripmap';
import { assembleItinerary } from '../lib/places/itineraryBuilder';

export function runDeduplicationTests() {
  const mockGeoCenter = { lat: 18.5204, lng: 73.8567 };

  const mockCandidatePlaces: Place[] = [
    {
      id: 'N1',
      name: 'Shaniwar Wada',
      lat: 18.5194,
      lng: 73.8553,
      kinds: ['historic', 'fortifications', 'interesting_places'],
      kindsStr: 'historic,fortifications,interesting_places',
      rate: 3,
      isIndoor: false,
      hasWiki: true,
      mapsUrl: 'https://maps.google.com/?q=18.5194,73.8553',
    },
    {
      id: 'N2',
      name: 'Aga Khan Palace',
      lat: 18.5524,
      lng: 73.9015,
      kinds: ['historic', 'monuments', 'interesting_places'],
      kindsStr: 'historic,monuments,interesting_places',
      rate: 3,
      isIndoor: false,
      hasWiki: true,
      mapsUrl: 'https://maps.google.com/?q=18.5524,73.9015',
    },
    {
      id: 'N3',
      name: 'Sinhagad Fort',
      lat: 18.3663,
      lng: 73.7558,
      kinds: ['historic', 'fortifications', 'natural'],
      kindsStr: 'historic,fortifications,natural',
      rate: 3,
      isIndoor: false,
      hasWiki: true,
      mapsUrl: 'https://maps.google.com/?q=18.3663,73.7558',
    },
    {
      id: 'N4',
      name: 'Raja Dinkar Kelkar Museum',
      lat: 18.5108,
      lng: 73.8542,
      kinds: ['cultural', 'museums', 'interesting_places'],
      kindsStr: 'cultural,museums,interesting_places',
      rate: 3,
      isIndoor: true,
      hasWiki: true,
      mapsUrl: 'https://maps.google.com/?q=18.5108,73.8542',
    },
    {
      id: 'N5',
      name: 'Pataleshwar Cave Temple',
      lat: 18.5273,
      lng: 73.8504,
      kinds: ['historic', 'caves', 'religion', 'hindu_temples'],
      kindsStr: 'historic,caves,religion,hindu_temples',
      rate: 3,
      isIndoor: true,
      hasWiki: true,
      mapsUrl: 'https://maps.google.com/?q=18.5273,73.8504',
    },
    {
      id: 'N6',
      name: 'Tribal Cultural Museum',
      lat: 18.5305,
      lng: 73.8785,
      kinds: ['cultural', 'museums'],
      kindsStr: 'cultural,museums',
      rate: 2,
      isIndoor: true,
      hasWiki: true,
      mapsUrl: 'https://maps.google.com/?q=18.5305,73.8785',
    },
    {
      id: 'N7',
      name: 'Parvati Hill Temple',
      lat: 18.4965,
      lng: 73.8475,
      kinds: ['historic', 'religion', 'view_points'],
      kindsStr: 'historic,religion,view_points',
      rate: 2,
      isIndoor: false,
      hasWiki: true,
      mapsUrl: 'https://maps.google.com/?q=18.4965,73.8475',
    },
    {
      id: 'N8',
      name: 'Chaturshringi Temple',
      lat: 18.5375,
      lng: 73.8288,
      kinds: ['religion', 'hindu_temples'],
      kindsStr: 'religion,hindu_temples',
      rate: 2,
      isIndoor: true,
      hasWiki: true,
      mapsUrl: 'https://maps.google.com/?q=18.5375,73.8288',
    },
    {
      id: 'N9',
      name: 'Saras Baug Garden',
      lat: 18.5009,
      lng: 73.8548,
      kinds: ['natural', 'parks', 'gardens'],
      kindsStr: 'natural,parks,gardens',
      rate: 2,
      isIndoor: false,
      hasWiki: true,
      mapsUrl: 'https://maps.google.com/?q=18.5009,73.8548',
    },
    {
      id: 'N10',
      name: 'Vetal Tekdi',
      lat: 18.5284,
      lng: 73.8164,
      kinds: ['natural', 'mountain_peaks', 'view_points'],
      kindsStr: 'natural,mountain_peaks,view_points',
      rate: 2,
      isIndoor: false,
      hasWiki: true,
      mapsUrl: 'https://maps.google.com/?q=18.5284,73.8164',
    },
    {
      id: 'N11',
      name: 'Empress Botanical Garden',
      lat: 18.5146,
      lng: 73.8964,
      kinds: ['natural', 'parks', 'gardens'],
      kindsStr: 'natural,parks,gardens',
      rate: 2,
      isIndoor: false,
      hasWiki: true,
      mapsUrl: 'https://maps.google.com/?q=18.5146,73.8964',
    },
    {
      id: 'N12',
      name: 'Joshi Museum of Miniature Railway',
      lat: 18.5042,
      lng: 73.8196,
      kinds: ['cultural', 'museums'],
      kindsStr: 'cultural,museums',
      rate: 2,
      isIndoor: true,
      hasWiki: true,
      mapsUrl: 'https://maps.google.com/?q=18.5042,73.8196',
    },
  ];

  // Test 1: deduplicatePlaces
  const placesWithDupes: Place[] = [
    mockCandidatePlaces[0],
    { ...mockCandidatePlaces[0], id: 'N1_duplicate' },
    {
      ...mockCandidatePlaces[0],
      id: 'N1_proximity_dupe',
      name: 'Shaniwar Wada Fort',
      lat: mockCandidatePlaces[0].lat + 0.0005,
      lng: mockCandidatePlaces[0].lng + 0.0005,
    },
    mockCandidatePlaces[1],
  ];

  const deduped = deduplicatePlaces(placesWithDupes);
  assert.strictEqual(deduped.length, 2, 'Should deduplicate proximity and id duplicates');
  assert.strictEqual(deduped[0].id, 'N1');
  assert.strictEqual(deduped[1].id, 'N2');
  console.log('✓ Test 1 Passed: deduplicatePlaces removes duplicates within 300m and matching IDs.');

  // Test 2: Trip-Wide Deduplication in assembleItinerary
  const preferredKinds = ['cultural', 'historic', 'museums', 'religion', 'natural'];
  const rainyDays = [false, false, false, false];

  const result = assembleItinerary(
    'Pune',
    mockCandidatePlaces,
    [],
    4,
    preferredKinds,
    rainyDays,
    mockGeoCenter
  );

  assert.strictEqual(result.dayPlans.length, 4, 'Should build 4 day plans');

  const allActivities = result.dayPlans.flatMap((dp) => dp.activities);
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();

  for (const act of allActivities) {
    assert.strictEqual(seenIds.has(act.id), false, `Duplicate ID detected: ${act.id} (${act.title})`);
    seenIds.add(act.id);

    const norm = act.title.trim().toLowerCase();
    assert.strictEqual(seenNames.has(norm), false, `Duplicate name detected: ${act.title}`);
    seenNames.add(norm);
  }
  console.log(`✓ Test 2 Passed: assembleItinerary guarantees zero duplicate places across all 4 days (${seenIds.size} unique places).`);

  // Test 3: Distance capping under 60km
  for (const dayPlan of result.dayPlans) {
    if (dayPlan.totalTravelKm !== undefined) {
      assert.ok(dayPlan.totalTravelKm <= 60, `Day ${dayPlan.dayNumber} exceeded 60km limit: ${dayPlan.totalTravelKm}km`);
    }
  }
  console.log('✓ Test 3 Passed: assembleItinerary caps daily travel distance under 60 km.');
}

if (require.main === module) {
  runDeduplicationTests();
}
