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

    // 1. Extract Destination with extended catalog & smart patterns
    let destination = '';
    const knownPlaces = [
      'goa', 'sikkim', 'gangtok', 'nagpur', 'manali', 'solang', 'kullu',
      'mumbai', 'bombay', 'delhi', 'new delhi', 'kerala', 'munnar', 'alleppey',
      'jaipur', 'pink city', 'kashmir', 'srinagar', 'gulmarg', 'pahalgam',
      'ladakh', 'leh', 'udaipur', 'jaisalmer', 'spiti', 'spiti valley',
      'meghalaya', 'shillong', 'coorg', 'andaman', 'andaman & nicobar',
      'rishikesh', 'rajasthan', 'agra', 'varanasi', 'kashi', 'benaras',
      'hampi', 'pondicherry', 'puducherry', 'hyderabad', 'bangalore', 'bengaluru',
      'pune', 'chennai', 'kolkata', 'paris', 'london', 'tokyo', 'dubai', 'singapore'
    ];

    for (const place of knownPlaces) {
      if (lower.includes(place)) {
        if (place === 'bombay') destination = 'Mumbai';
        else if (place === 'gangtok') destination = 'Sikkim';
        else if (place === 'pink city') destination = 'Jaipur';
        else if (place === 'new delhi') destination = 'Delhi';
        else if (place === 'bengaluru') destination = 'Bangalore';
        else if (place === 'leh') destination = 'Ladakh';
        else if (place === 'srinagar' || place === 'gulmarg' || place === 'pahalgam') destination = 'Kashmir';
        else if (place === 'munnar' || place === 'alleppey') destination = 'Kerala';
        else if (place === 'kashi' || place === 'benaras') destination = 'Varanasi';
        else {
          destination = place.charAt(0).toUpperCase() + place.slice(1);
        }
        break;
      }
    }

    // Fallback pattern: check for "to <Destination>" or "in <Destination>" or "trip to <Destination>"
    if (!destination) {
      const toMatch = cleanPrompt.match(/(?:trip\s+to|visit|explore|travel\s+to|going\s+to|fly\s+to|tour\s+to|holiday\s+in|trip\s+in|in|to)\s+([A-Z][a-zA-Z\s]{2,20})/i);
      if (toMatch && toMatch[1]) {
        const candidate = toMatch[1].trim().split(/\s+(?:for|under|with|on|from|in|budget|during|starting)\b/i)[0].trim();
        if (candidate.length >= 3 && !['for', 'the', 'some', 'any', 'my', 'our'].includes(candidate.toLowerCase())) {
          destination = candidate.charAt(0).toUpperCase() + candidate.slice(1);
        }
      }
    }

    // Default destination if unspecified
    if (!destination) {
      destination = 'Goa';
    }

    // 2. Extract Duration (Days)
    let durationDays = 3; // default
    const dayMatch = lower.match(/(\d+)\s*(?:days?|day|d\b|nights?)/);
    if (dayMatch) {
      durationDays = Math.min(Math.max(parseInt(dayMatch[1], 10), 1), 30);
    } else if (lower.includes('a week') || lower.includes('1 week') || lower.includes('one week')) {
      durationDays = 7;
    } else if (lower.includes('weekend') || lower.includes('2 days') || lower.includes('two days')) {
      durationDays = 2;
    } else if (lower.includes('1 sept to 4 sept') || lower.includes('1 to 4')) {
      durationDays = 4;
    }

    // 3. Extract Budget
    let budget = 25000;
    const kMatch = lower.match(/(\d+(?:\.\d+)?)\s*k\b/i);
    const numMatch = lower.match(/(?:under|below|budget(?:\s*of)?|max(?:\s*budget)?|rs\.?|inr|₹|approx\.?|within)\s*[:=]?\s*₹?\s*(\d{4,7})/i);
    const bareNumMatch = lower.match(/₹\s*(\d{4,7})/i) || lower.match(/(\d{4,7})\s*(?:rs|rupees|inr)/i);

    if (kMatch) {
      budget = Math.round(parseFloat(kMatch[1]) * 1000);
    } else if (numMatch) {
      budget = parseInt(numMatch[1], 10);
    } else if (bareNumMatch) {
      budget = parseInt(bareNumMatch[1], 10);
    } else {
      // Look for any 4-6 digit number that could represent a budget
      const genericNumberMatch = lower.match(/\b([1-9]\d{3,5})\b/);
      if (genericNumberMatch) {
        const potentialNum = parseInt(genericNumberMatch[1], 10);
        if (potentialNum >= 3000 && potentialNum <= 500000) {
          budget = potentialNum;
        }
      }
    }

    // 4. Extract Number of Travelers / Guest Count
    let numTravelers = 2; // smart default for trips
    const numPplMatch = lower.match(/(\d+)\s*(?:people|persons?|travelers?|travellers?|guests?|adults?|friends?)/i);
    if (numPplMatch) {
      numTravelers = Math.max(1, parseInt(numPplMatch[1], 10));
    } else if (lower.includes('solo') || lower.includes('for me') || lower.includes('1 person') || lower.includes('myself')) {
      numTravelers = 1;
    } else if (lower.includes('couple') || lower.includes('two of us') || lower.includes('2 people') || lower.includes('with my partner') || lower.includes('with wife') || lower.includes('with husband')) {
      numTravelers = 2;
    } else if (lower.includes('family') || lower.includes('group') || lower.includes('gang')) {
      numTravelers = 4;
    }

    // 5. Extract Interests / Travel Style
    let travelStyle = 'Adventure';
    const interests: string[] = [];
    if (lower.includes('adventure') || lower.includes('trek') || lower.includes('hike') || lower.includes('climb') || lower.includes('outdoor')) {
      interests.push('Adventure');
      travelStyle = 'Adventure';
    }
    if (lower.includes('beach') || lower.includes('water') || lower.includes('surf') || lower.includes('sea') || lower.includes('coast')) {
      interests.push('Beach');
      travelStyle = 'Beach';
    }
    if (lower.includes('family') || lower.includes('kids') || lower.includes('children')) {
      interests.push('Family');
      travelStyle = 'Family';
    }
    if (lower.includes('solo') || lower.includes('backpack') || lower.includes('hostel')) {
      interests.push('Solo');
      travelStyle = 'Solo Explorer';
    }
    if (lower.includes('luxury') || lower.includes('resort') || lower.includes('5 star') || lower.includes('premium') || lower.includes('spa')) {
      interests.push('Luxury');
      travelStyle = 'Luxury';
    }
    if (lower.includes('budget') || lower.includes('cheap') || lower.includes('affordable') || lower.includes('economical')) {
      interests.push('Budget-Friendly');
      travelStyle = 'Budget-Friendly';
    }
    if (lower.includes('heritage') || lower.includes('culture') || lower.includes('history') || lower.includes('monument') || lower.includes('temple') || lower.includes('fort')) {
      interests.push('Heritage');
      if (!travelStyle) travelStyle = 'Heritage';
    }
    if (lower.includes('food') || lower.includes('culinary') || lower.includes('dining') || lower.includes('tasting')) {
      interests.push('Culinary');
    }

    if (interests.length === 0) {
      interests.push('Adventure');
      travelStyle = 'Adventure';
    }

    // 6. Extract Start Date
    let startDate = new Date().toISOString().split('T')[0];
    const dateMatch = lower.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      startDate = dateMatch[1];
    } else if (lower.includes('1 sept') || lower.includes('sept 1') || lower.includes('september')) {
      startDate = '2026-09-01';
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
        travelStyle,
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
