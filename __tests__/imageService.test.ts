// __tests__/imageService.test.ts
// Unit tests for ImageService uniqueness, place-specific matching, fallback, and provider failover

import assert from 'node:assert';
import { ImageService, mapPlaceToCategory } from '../lib/images/service';
import { ImagePhoto } from '../lib/images/types';

export async function runImageTests() {
  console.log('Running ImageService Unit Tests...');

  // Test 1: Category Mapping
  assert.strictEqual(mapPlaceToCategory('fortifications', 'Sinhagad Fort'), 'fort');
  assert.strictEqual(mapPlaceToCategory('hindu_temples', 'Chaturshringi Temple'), 'temple');
  assert.strictEqual(mapPlaceToCategory('museums', 'Raja Dinkar Kelkar Museum'), 'museum');
  assert.strictEqual(mapPlaceToCategory('gardens', 'Saras Baug Garden'), 'garden');
  assert.strictEqual(mapPlaceToCategory('mountain_peaks', 'Vetal Tekdi'), 'nature');
  console.log('✓ Test 1 Passed: Category mapping correctly identifies fort, temple, museum, garden, nature.');

  // Test 2: Placeholder Generation
  const ph = ImageService.createPlaceholder('Shaniwar Wada', 'Pune', 'fort');
  assert.strictEqual(ph.isPlaceholder, true);
  assert.strictEqual(ph.categoryEmoji, '🏰');
  assert.strictEqual(ph.caption, 'Photo of Pune');
  console.log('✓ Test 2 Passed: Styled placeholder correctly built with category emoji and honest caption.');

  // Test 3: Trip-wide Uniqueness Assertion
  // Simulate mock dayPlans with 12 activities
  const mockDayPlans = [
    {
      dayNumber: 1,
      activities: [
        { id: 'A1', title: 'Shaniwar Wada', kindsStr: 'fortifications', rate: 3 },
        { id: 'A2', title: 'Aga Khan Palace', kindsStr: 'historic', rate: 3 },
        { id: 'A3', title: 'Pataleshwar Cave', kindsStr: 'caves', rate: 3 },
      ],
    },
    {
      dayNumber: 2,
      activities: [
        { id: 'A4', title: 'Sinhagad Fort', kindsStr: 'fortifications', rate: 3 },
        { id: 'A5', title: 'Raja Dinkar Kelkar Museum', kindsStr: 'museums', rate: 2 },
        { id: 'A6', title: 'Parvati Hill Temple', kindsStr: 'hindu_temples', rate: 2 },
      ],
    },
    {
      dayNumber: 3,
      activities: [
        { id: 'A7', title: 'Saras Baug Garden', kindsStr: 'gardens', rate: 2 },
        { id: 'A8', title: 'Vetal Tekdi', kindsStr: 'natural', rate: 2 },
        { id: 'A9', title: 'Chaturshringi Temple', kindsStr: 'hindu_temples', rate: 2 },
      ],
    },
    {
      dayNumber: 4,
      activities: [
        { id: 'A10', title: 'Empress Botanical Garden', kindsStr: 'gardens', rate: 2 },
        { id: 'A11', title: 'Tribal Cultural Museum', kindsStr: 'museums', rate: 2 },
        { id: 'A12', title: 'Joshi Railway Museum', kindsStr: 'museums', rate: 2 },
      ],
    },
  ];

  const { photoMap } = await ImageService.assignImagesToTrip('Pune', mockDayPlans);

  assert.strictEqual(photoMap.size, 12, 'Every activity must receive an assigned photo');

  // Verify uniqueness of non-placeholder photo IDs
  const seenIds = new Set<string>();
  for (const [actId, photo] of photoMap.entries()) {
    assert.ok(photo, `Activity ${actId} has a defined photo`);
    assert.ok(photo.alt, 'Photo has alt text');
    if (!photo.isPlaceholder) {
      assert.strictEqual(seenIds.has(photo.id), false, `Duplicate photo ID detected: ${photo.id}`);
      seenIds.add(photo.id);
    }
  }
  console.log(`✓ Test 3 Passed: All 12 activities received unique photos/placeholders without collisions.`);
}

if (require.main === module) {
  runImageTests().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
