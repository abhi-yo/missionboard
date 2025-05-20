import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EventStatus } from '@/lib/generated/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
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
            name: true
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
        eventImage: true
      },
      orderBy: { date: 'asc' }
    });

    // Format events for public consumption
    const formattedEvents = publicEvents.map(event => {
      const attendeeCount = event.registrations.reduce((sum, reg) => sum + reg.guestsCount + 1, 0);
      
      // Set the image URL properly - first try the relation, then fallback to coverImage
      const imageUrl = event.eventImage 
        ? `/api/images/${event.eventImage.id}`
        : event.coverImage || '/images/default-event.jpg';
        
      return {
        id: event.id,
        title: event.name,
        description: event.description,
        date: event.date.toISOString(),
        endDate: event.endDate?.toISOString() || null,
        location: event.location,
        organizer: event.organizer?.name || 'Event Organizer',
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
    console.error('Error fetching public events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
} 