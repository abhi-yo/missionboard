import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EventStatus } from '@/lib/generated/prisma';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id;
    
    // Fetch the event details
    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
        isPrivate: false,
        status: EventStatus.SCHEDULED
      },
      include: {
        organizer: {
          select: {
            name: true,
            image: true
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
      }
    });
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found or not available for public viewing' }, 
        { status: 404 }
      );
    }
    
    // Calculate attendee count
    const attendeeCount = event.registrations.reduce((sum, reg) => sum + reg.guestsCount + 1, 0);
    
    // Set the image URL properly - first try the relation, then fallback to coverImage
    const imageUrl = event.eventImage 
      ? `/api/images/${event.eventImage.id}`
      : event.coverImage || '/images/default-event.jpg';
      
    // Format the event for public consumption
    const formattedEvent = {
      id: event.id,
      title: event.name,
      description: event.description,
      date: event.date.toISOString(),
      formattedDate: format(new Date(event.date), 'EEEE, MMMM d, yyyy'),
      startTime: format(new Date(event.date), 'h:mm a'),
      endTime: event.endDate ? format(new Date(event.endDate), 'h:mm a') : null,
      location: event.location,
      locationDetails: event.locationDetails,
      organizer: event.organizer?.name || 'Event Organizer',
      organizerImage: event.organizer?.image,
      capacity: event.capacity,
      registered: attendeeCount,
      registrationDeadline: event.registrationDeadline?.toISOString() || null,
      image: imageUrl,
      isFull: event.capacity ? attendeeCount >= event.capacity : false,
      hasDeadlinePassed: event.registrationDeadline ? new Date() > new Date(event.registrationDeadline) : false
    };
    
    return NextResponse.json(formattedEvent);
  } catch (error) {
    console.error('Error fetching public event:', error);
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 });
  }
} 