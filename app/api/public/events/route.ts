import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EventStatus } from '@/lib/generated/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log("[/api/public/events GET] Fetching all public events");
    // Fetch all public events that are scheduled and have not passed
    const publicEvents = await prisma.event.findMany({
      where: {
        isPrivate: false,
        status: EventStatus.SCHEDULED,
        date: { gte: new Date() }
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            // Include any organization info the admin has set up
            notes: true
          }
        },
        registrations: {
          where: {
            status: {
              in: ['CONFIRMED', 'ATTENDED']
            }
          },
          select: {
            guestsCount: true
          }
        },
        coverImage: true
      },
      orderBy: { date: 'asc' }
    });

    console.log(`[/api/public/events GET] Found ${publicEvents.length} public events`);

    // Format events for public consumption
    const formattedEvents = publicEvents.map(event => {
      const attendeeCount = event.registrations.reduce((sum, reg) => sum + reg.guestsCount + 1, 0);
      
      // Set the image URL properly - first try the relation, then fallback to coverImage
      const imageUrl = event.coverImage 
        ? `/api/images/${event.coverImage.id}`
        : event.coverImage || '/images/default-event.jpg';
        
      // Extract organization name from notes if available
      let organizationName = "Event Organizer";
      if (event.organizer?.notes) {
        // Try to find an organization name in the notes
        const orgMatch = event.organizer.notes.match(/Organization:\s*([^\n]+)/i);
        if (orgMatch && orgMatch[1]) {
          organizationName = orgMatch[1].trim();
        }
      }
        
      return {
        id: event.id,
        title: event.name,
        description: event.description,
        date: event.date.toISOString(),
        endDate: event.endDate?.toISOString() || null,
        location: event.location,
        organizer: event.organizer?.name || organizationName,
        organizationName: organizationName,
        organizerId: event.organizer?.id,
        capacity: event.capacity,
        registered: attendeeCount,
        registrationDeadline: event.registrationDeadline?.toISOString() || null,
        image: imageUrl,
        slug: event.id, // Using ID as slug for simplicity
        isFull: event.capacity ? attendeeCount >= event.capacity : false
      };
    });

    return NextResponse.json(formattedEvents);
  } catch (error) {
    console.error('[/api/public/events GET] Error fetching public events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
} 