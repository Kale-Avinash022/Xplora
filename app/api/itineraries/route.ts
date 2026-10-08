import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UnsplashProvider } from '@/lib/images/unsplash';
import { getAuthenticatedUser } from '@/lib/auth/session';

export async function GET(req: Request) {
  try {
    const authenticatedUser = await getAuthenticatedUser(req);

    if (!authenticatedUser) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to view saved itineraries.' },
        { status: 401 }
      );
    }

    const itineraries = await prisma.itinerary.findMany({
      where: { userId: authenticatedUser.id },
      include: {
        dayPlans: {
          include: {
            activities: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(itineraries, { status: 200 });
  } catch (error) {
    console.error('Fetch Itineraries API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch itineraries' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const authenticatedUser = await getAuthenticatedUser(req);

    if (!authenticatedUser) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to save itineraries to your account.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    // Step 72: Body parsing strictly excludes client-supplied userId. Server derives identity from session.
    const { title, destination, durationDays, budget, currency = 'INR', travelStyle = 'General', dayPlans } = body;

    if (!title || !destination || !dayPlans) {
      return NextResponse.json(
        { error: 'Missing required itinerary fields' },
        { status: 400 }
      );
    }

    const savedItinerary = await prisma.itinerary.create({
      data: {
        title,
        destination,
        durationDays: Number(durationDays),
        budget: Number(budget),
        currency,
        travelStyle,
        userId: authenticatedUser.id,
        dayPlans: {
          create: dayPlans.map((dp: any) => ({
            dayNumber: dp.dayNumber,
            summary: dp.summary,
            activities: {
              create: dp.activities.map((act: any) => ({
                timeSlot: act.timeSlot,
                title: act.title,
                description: act.description,
                category: act.category || 'Sightseeing',
                cost: Number(act.cost) || 0,
                location: act.location,
              })),
            },
          })),
        },
      },
      include: {
        dayPlans: {
          include: {
            activities: true,
          },
        },
      },
    });

    // Unsplash download tracking (server-side GET with Client-ID to downloadLocation, once per photo)
    try {
      const unsplashPhotosToTrack: { downloadLocation: string; photoId: string }[] = [];
      for (const dp of dayPlans) {
        if (Array.isArray(dp.activities)) {
          for (const act of dp.activities) {
            if (
              act.image &&
              act.image.provider === 'unsplash' &&
              act.image.downloadLocation &&
              act.image.id
            ) {
              unsplashPhotosToTrack.push({
                downloadLocation: act.image.downloadLocation,
                photoId: act.image.id,
              });
            }
          }
        }
      }

      // Track concurrently in background (non-blocking)
      Promise.allSettled(
        unsplashPhotosToTrack.map((item) =>
          UnsplashProvider.trackDownload(item.downloadLocation, item.photoId)
        )
      ).catch(() => {});
    } catch (trackErr) {
      console.error('[Save Itinerary] Error tracking Unsplash downloads:', trackErr);
    }

    return NextResponse.json(
      { message: 'Itinerary saved successfully!', itinerary: savedItinerary },
      { status: 201 }
    );
  } catch (error) {
    console.error('Save Itinerary API Error:', error);
    return NextResponse.json(
      { error: 'Failed to save itinerary' },
      { status: 500 }
    );
  }
}
