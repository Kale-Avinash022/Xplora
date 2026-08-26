import { NextResponse } from 'next/server';

export interface ParsedTripEntities {
  destination: string;
  startDate: string;
  durationDays: number;
  budget: number;
  numTravelers: number;
  interests: string[];
  missingFields: string[];
  clarifyingQuestion?: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt = '' } = body;

    const cleanPrompt = prompt.trim();
    if (!cleanPrompt || cleanPrompt.length < 3) {
      return NextResponse.json(
        { error: 'Prompt must be at least 3 characters long.' },
        { status: 400 }
      );
    }

    const lower = cleanPrompt.toLowerCase();

    // 1. Extract Destination
    let destination = '';
    const knownPlaces = ['goa', 'nagpur', 'manali', 'mumbai', 'delhi', 'kerala', 'jaipur', 'kashmir', 'ladakh', 'udaipur', 'paris', 'london', 'tokyo', 'dubai'];
    for (const place of knownPlaces) {
      if (lower.includes(place)) {
        destination = place.charAt(0).toUpperCase() + place.slice(1);
        break;
      }
    }

    // 2. Extract Duration (Days)
    let durationDays = 3; // default
    const dayMatch = lower.match(/(\d+)\s*(?:days?|day|d\b)/);
    if (dayMatch) {
      durationDays = Math.min(Math.max(parseInt(dayMatch[1], 10), 1), 30);
    } else if (lower.includes('1 sept to 4 sept') || lower.includes('1 to 4')) {
      durationDays = 4;
    }

    // 3. Extract Budget
    let budget = 25000;
    const kMatch = lower.match(/(\d+(?:\.\d+)?)\s*k\b/i);
    const numMatch = lower.match(/(\d{4,6})\b/i);
    if (kMatch) {
      budget = Math.round(parseFloat(kMatch[1]) * 1000);
    } else if (numMatch && (lower.includes('budget') || lower.includes('price') || lower.includes('under') || lower.includes('rs') || lower.includes('₹') || lower.includes('cost'))) {
      budget = parseInt(numMatch[1], 10);
    }

    // 4. Extract Number of Travelers
    let numTravelers = 1;
    if (lower.includes('solo') || lower.includes('for me') || lower.includes('1 person')) {
      numTravelers = 1;
    } else if (lower.includes('two people') || lower.includes('2 people') || lower.includes('couple') || lower.includes('2 travelers') || lower.includes('for 2')) {
      numTravelers = 2;
    } else if (lower.includes('family') || lower.includes('4 people') || lower.includes('group')) {
      numTravelers = 4;
    }

    // 5. Extract Interests / Travel Style
    const interests: string[] = [];
    if (lower.includes('adventure') || lower.includes('trek') || lower.includes('hike')) interests.push('Adventure');
    if (lower.includes('beach') || lower.includes('water') || lower.includes('surf')) interests.push('Beach');
    if (lower.includes('veg') || lower.includes('food') || lower.includes('culinary') || lower.includes('dining')) interests.push('Culinary');
    if (lower.includes('heritage') || lower.includes('fort') || lower.includes('museum') || lower.includes('culture')) interests.push('Heritage');
    if (lower.includes('luxury') || lower.includes('relax') || lower.includes('spa')) interests.push('Relaxation');
    if (interests.length === 0) interests.push('Adventure');

    // 6. Extract Start Date
    let startDate = new Date().toISOString().split('T')[0];
    if (lower.includes('1 sept') || lower.includes('sept 1') || lower.includes('september')) {
      startDate = '2026-09-01';
    }

    // Check Missing Fields
    const missingFields: string[] = [];
    if (!destination) {
      missingFields.push('destination');
    }

    if (missingFields.length > 0) {
      let clarifyingQuestion = 'Which destination would you like to explore? (e.g. Goa, Nagpur, Manali, Jaipur, Mumbai)';
      return NextResponse.json({
        hasMissingFields: true,
        missingFields,
        clarifyingQuestion,
        partiallyParsed: {
          destination: destination || 'Goa',
          startDate,
          durationDays,
          budget,
          numTravelers,
          interests,
        }
      }, { status: 200 });
    }

    return NextResponse.json({
      hasMissingFields: false,
      missingFields: [],
      entities: {
        destination,
        startDate,
        durationDays,
        budget,
        numTravelers,
        interests,
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Parse Query API Error:', error);
    return NextResponse.json(
      { error: 'Failed to parse natural language query.' },
      { status: 500 }
    );
  }
}
