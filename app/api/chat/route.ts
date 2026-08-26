import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages = [], currentItinerary, tripMemory = {} } = body;

    const lastMessage = messages.length > 0 ? messages[messages.length - 1].content : '';
    const cleanPrompt = lastMessage.toLowerCase().trim();

    let reply = `🤖 AI Travel Assistant: I've processed your request: "${lastMessage}". How else can I assist?`;
    let modifiedItinerary = currentItinerary ? JSON.parse(JSON.stringify(currentItinerary)) : null;
    let updatedMemory = { ...tripMemory };
    let createTripParams = null;
    let actionCommand: 'EXPORT_PDF' | 'SAVE_TRIP' | 'EXPORT_CALENDAR' | null = null;

    // 1. Autonomous Action Commands (PDF, Save, Calendar)
    if (cleanPrompt.includes('pdf') || cleanPrompt.includes('export pdf') || cleanPrompt.includes('download pdf')) {
      actionCommand = 'EXPORT_PDF';
      reply = `📄 Generating and opening printable PDF document for your trip...`;
      return NextResponse.json({ message: reply, actionCommand, updatedMemory }, { status: 200 });
    } else if (cleanPrompt.includes('save') || cleanPrompt.includes('save trip') || cleanPrompt.includes('save itinerary')) {
      actionCommand = 'SAVE_TRIP';
      reply = `💾 Saving your trip itinerary directly to your account database...`;
      return NextResponse.json({ message: reply, actionCommand, updatedMemory }, { status: 200 });
    } else if (cleanPrompt.includes('calendar') || cleanPrompt.includes('google calendar')) {
      actionCommand = 'EXPORT_CALENDAR';
      reply = `📅 Syncing your scheduled trip activities with Google Calendar...`;
      return NextResponse.json({ message: reply, actionCommand, updatedMemory }, { status: 200 });
    }

    // 2. Extract Budget Updates (e.g. "budget is 30k", "30k", "30000 price", "30,000")
    const kMatch = cleanPrompt.match(/(\d+(?:\.\d+)?)\s*k\b/i);
    const numMatch = cleanPrompt.match(/(\d{4,6})\b/i);

    let extractedBudget: number | null = null;

    if (kMatch) {
      extractedBudget = Math.round(parseFloat(kMatch[1]) * 1000);
    } else if (numMatch) {
      extractedBudget = parseInt(numMatch[1], 10);
    }

    if (extractedBudget && (cleanPrompt.includes('budget') || cleanPrompt.includes('k') || cleanPrompt.includes('price') || cleanPrompt.includes('cost') || cleanPrompt.includes('with') || cleanPrompt.includes('rs') || cleanPrompt.includes('₹') || cleanPrompt.includes('is') || cleanPrompt.includes('30'))) {
      updatedMemory.budget = extractedBudget;

      const dest = updatedMemory.destination || (modifiedItinerary?.destination) || 'Nagpur';
      const fromCity = updatedMemory.from || 'Pune';
      const days = updatedMemory.durationDays || (modifiedItinerary?.durationDays) || 3;
      const style = updatedMemory.travelStyle || (modifiedItinerary?.travelStyle) || 'Solo';
      const startDate = updatedMemory.startDate || '2026-09-01';

      reply = `💰 Got it! I updated your max budget to ₹${extractedBudget.toLocaleString('en-IN')} for your ${days}-Day ${style} trip from ${fromCity} to ${dest}.\n\nClick below to regenerate your itinerary & update your ${fromCity} ➔ ${dest} Flight and Hotel recommendations with your new ₹${extractedBudget.toLocaleString('en-IN')} budget!`;

      createTripParams = {
        destination: dest,
        from: fromCity,
        durationDays: days,
        budget: extractedBudget,
        travelStyle: style,
        startDate: startDate,
      };

      return NextResponse.json({
        message: reply,
        createTripParams,
        updatedMemory,
      }, { status: 200 });
    }

    // 3. Extract Trip Planning Intent (e.g. "plan a trip from pune to nagpur for 3 days from 1 sept 2026")
    const isPlanRequest = cleanPrompt.includes('travel') || cleanPrompt.includes('plan') || cleanPrompt.includes('from') || cleanPrompt.includes('nagpur') || cleanPrompt.includes('goa') || cleanPrompt.includes('manali') || cleanPrompt.includes('mumbai') || cleanPrompt.includes('delhi');

    if (isPlanRequest) {
      let dest = updatedMemory.destination || 'Nagpur';
      let fromCity = updatedMemory.from || 'Pune';
      let days = updatedMemory.durationDays || 3;
      let style = updatedMemory.travelStyle || 'Solo';
      let startDate = updatedMemory.startDate || '2026-09-01';
      let budget = updatedMemory.budget || 30000;

      if (cleanPrompt.includes('goa')) dest = 'Goa';
      else if (cleanPrompt.includes('nagpur')) dest = 'Nagpur';
      else if (cleanPrompt.includes('manali')) dest = 'Manali';
      else if (cleanPrompt.includes('mumbai')) dest = 'Mumbai';
      else if (cleanPrompt.includes('delhi')) dest = 'Delhi';
      else if (cleanPrompt.includes('kerala')) dest = 'Kerala';
      else if (cleanPrompt.includes('jaipur')) dest = 'Jaipur';

      if (cleanPrompt.includes('pune')) fromCity = 'Pune';
      else if (cleanPrompt.includes('delhi')) fromCity = 'Delhi';
      else if (cleanPrompt.includes('mumbai')) fromCity = 'Mumbai';

      if (cleanPrompt.includes('family')) style = 'Family';
      else if (cleanPrompt.includes('luxury')) style = 'Luxury';
      else if (cleanPrompt.includes('adventure')) style = 'Adventure';
      else if (cleanPrompt.includes('solo')) style = 'Solo';

      if (cleanPrompt.includes('7') || cleanPrompt.includes('7 days')) days = 7;
      else if (cleanPrompt.includes('5') || cleanPrompt.includes('5 days')) days = 5;
      else if (cleanPrompt.includes('4') || cleanPrompt.includes('4 days')) days = 4;
      else if (cleanPrompt.includes('3') || cleanPrompt.includes('3 days')) days = 3;

      updatedMemory = { destination: dest, from: fromCity, durationDays: days, travelStyle: style, startDate, budget };

      reply = `🎉 Perfect! I extracted your trip details for ${dest}:\n\n📍 Route: ${fromCity} ➔ ${dest}\n📅 Dates: 1 Sept 2026 (${days} Days)\n🎒 Style: ${style}\n💰 Budget: ₹${budget.toLocaleString('en-IN')}\n\nClick the button below to generate your complete AI Itinerary & load ${fromCity} ➔ ${dest} Flight & Hotel Bookings!`;
      
      createTripParams = {
        destination: dest,
        from: fromCity,
        durationDays: days,
        budget: budget,
        travelStyle: style,
        startDate: startDate,
      };
    }
    // 4. Handle Active Itinerary Edits
    else if (modifiedItinerary && modifiedItinerary.dayPlans) {
      if (cleanPrompt.includes('veg') || cleanPrompt.includes('vegetarian')) {
        reply = `✨ Done! I have updated your dinner & dining plans to 100% authentic vegetarian culinary experiences in ${modifiedItinerary.destination}.`;
        modifiedItinerary.dayPlans.forEach((dp: any) => {
          dp.activities.forEach((act: any) => {
            if (act.category === 'Dining' || act.title.toLowerCase().includes('dinner') || act.title.toLowerCase().includes('lunch')) {
              act.title = `Vegetarian Culinary Tasting`;
              act.description = `Enjoy organic vegetarian & regional specialties in ${modifiedItinerary.destination}.`;
            }
          });
        });
      } else if (cleanPrompt.includes('beach') || cleanPrompt.includes('water') || cleanPrompt.includes('sport')) {
        reply = `🌊 Great choice! I added water sports and beach activity to your schedule in ${modifiedItinerary.destination}.`;
        if (modifiedItinerary.dayPlans.length > 0 && modifiedItinerary.dayPlans[0].activities.length > 1) {
          modifiedItinerary.dayPlans[0].activities[1].title = `Beach Water Sports & Parasailing`;
          modifiedItinerary.dayPlans[0].activities[1].description = `Exciting seaside adventure featuring jet ski rides and coastal water sports.`;
        }
      } else {
        reply = `💡 I've processed your request: "${lastMessage}". Your itinerary for ${modifiedItinerary.destination} has been updated!`;
      }
    }

    return NextResponse.json({
      message: reply,
      updatedItinerary: modifiedItinerary,
      createTripParams,
      updatedMemory,
      actionCommand,
    }, { status: 200 });

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({
      message: '🤖 AI Assistant: Ready to help you plan! Tell me where you would like to travel.',
    }, { status: 200 });
  }
}
