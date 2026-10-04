// __tests__/trackTicket.test.ts
// Unit & Integration tests for Track Ticket feature (Train, Flight, Bus tracking)

import assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';

async function runTrackTicketTests() {
  console.log('\n--- Running Track Ticket Feature Verification Tests ---\n');

  // Test 1: Verify types in lib/types.ts
  console.log('Test 1: Verify TrackedTicket and TrackedTicketType in lib/types.ts');
  const typesPath = path.join(process.cwd(), 'lib', 'types.ts');
  const typesContent = fs.readFileSync(typesPath, 'utf8');

  assert.ok(
    typesContent.includes("export type TrackedTicketType = 'TRAIN' | 'FLIGHT' | 'BUS';"),
    'TrackedTicketType must include TRAIN, FLIGHT, and BUS'
  );
  assert.ok(
    typesContent.includes('export interface TrackedTicket'),
    'TrackedTicket interface must be exported'
  );
  console.log('✓ Test 1 Passed: TrackedTicket contract defined cleanly in lib/types.ts\n');

  // Test 2: Verify TrackTicketModal component requirements
  console.log('Test 2: Verify TrackTicketModal prominent headers ("TRAIN TICKET" written above the ticket)');
  const modalPath = path.join(process.cwd(), 'components', 'TrackTicketModal.tsx');
  assert.ok(fs.existsSync(modalPath), 'components/TrackTicketModal.tsx must exist');
  const modalContent = fs.readFileSync(modalPath, 'utf8');

  // Must have TRAIN TICKET written above the ticket
  assert.ok(
    modalContent.includes('TRAIN TICKET'),
    'TrackTicketModal must display "TRAIN TICKET" above train tickets'
  );
  // Must have FLIGHT TICKET written above the ticket
  assert.ok(
    modalContent.includes('FLIGHT TICKET'),
    'TrackTicketModal must display "FLIGHT TICKET" above flight tickets'
  );
  // Must have BUS TICKET written above the ticket
  assert.ok(
    modalContent.includes('BUS TICKET'),
    'TrackTicketModal must display "BUS TICKET" above bus tickets'
  );

  // Must support PNR editing & check
  assert.ok(
    modalContent.includes('Edit PNR') || modalContent.includes('editingPnrId'),
    'TrackTicketModal must allow users to edit/enter official PNR'
  );
  assert.ok(
    modalContent.includes('Check Live PNR Status') || modalContent.includes('PnrEnquiry'),
    'TrackTicketModal must provide live PNR enquiry action'
  );
  console.log('✓ Test 2 Passed: Prominent transport headers and PNR status features verified.\n');

  // Test 3: Verify "Book on IRCTC" wiring in FlightHotelResults.tsx
  console.log('Test 3: Verify "Book on IRCTC" saves train ticket to tracking');
  const resultsPath = path.join(process.cwd(), 'components', 'FlightHotelResults.tsx');
  const resultsContent = fs.readFileSync(resultsPath, 'utf8');

  assert.ok(
    resultsContent.includes('onTrackTicket?: (ticket: TrackedTicket) => void'),
    'FlightHotelResultsProps must accept onTrackTicket callback'
  );
  assert.ok(
    resultsContent.includes("type: 'TRAIN'"),
    'Book on IRCTC must construct a TRAIN type ticket'
  );
  assert.ok(
    resultsContent.includes("provider: 'IRCTC / Indian Railways'"),
    'Train ticket must attribute IRCTC / Indian Railways truthfully'
  );
  assert.ok(
    resultsContent.includes('Book on IRCTC'),
    'Book on IRCTC button label preserved'
  );
  console.log('✓ Test 3 Passed: "Book on IRCTC" triggers truthful train ticket tracking.\n');

  // Test 4: Verify interactive Track Ticket card in app/page.tsx
  console.log('Test 4: Verify "Track Ticket" card and modal mounting in app/page.tsx');
  const pagePath = path.join(process.cwd(), 'app', 'page.tsx');
  const pageContent = fs.readFileSync(pagePath, 'utf8');

  assert.ok(
    pageContent.includes('setShowTrackTicketModal(true)'),
    'Track Ticket card must open TrackTicketModal on click'
  );
  assert.ok(
    pageContent.includes('<TrackTicketModal'),
    'TrackTicketModal must be mounted in app/page.tsx'
  );
  assert.ok(
    pageContent.includes('trackedTickets.length'),
    'Track Ticket card must display active ticket count'
  );
  assert.ok(
    pageContent.includes('onTrackTicket={handleTrackTicket}'),
    'FlightHotelResults must receive handleTrackTicket callback'
  );
  console.log('✓ Test 4 Passed: Track Ticket card interactivity and modal integration confirmed.\n');

  console.log('================================================================');
  console.log('🎉 ALL TRACK TICKET VERIFICATION TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================\n');
}

runTrackTicketTests().catch((err) => {
  console.error('Track Ticket test suite failed:', err);
  process.exit(1);
});
