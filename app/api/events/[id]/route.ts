import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { EventStatus } from '@/lib/generated/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = params.id;
    
    // Fetch the event
    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
        organizerId: session.user.id, // Only allow the event organizer to access
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        eventImage: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Get registration count for this event
    const registrationCount = await prisma.eventRegistration.count({
      where: {
        eventId,
        status: {
          in: ['CONFIRMED', 'ATTENDED'],
        },
      },
    });

    // Format dates and times for easier use on the frontend
    const eventDate = new Date(event.date);
    
    // Set image URL - first try the relation, then fallback to coverImage
    const imageUrl = event.eventImage 
      ? `/api/images/${event.eventImage.id}`
      : event.coverImage || '';
      
    const formattedEvent = {
      ...event,
      time: eventDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }),
      registered: registrationCount,
    };

    return NextResponse.json(formattedEvent);
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = params.id;
    const data = await request.json();
    
    // First check if the event exists and user is the organizer
    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
        organizerId: session.user.id, // Only allow the event organizer to update
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found or you don\'t have permission to update it' }, { status: 404 });
    }

    // Update the event
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data,
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = params.id;
    
    // First check if the event exists and user is the organizer
    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
        organizerId: session.user.id, // Only allow the event organizer to delete
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found or you don\'t have permission to delete it' }, { status: 404 });
    }

    // Delete all registrations first (cascade delete is not automatic)
    await prisma.eventRegistration.deleteMany({
      where: { eventId },
    });

    // Delete the event
    await prisma.event.delete({
      where: { id: eventId },
    });

    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
} 