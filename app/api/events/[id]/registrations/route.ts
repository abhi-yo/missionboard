import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

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
    
    // First check if the event exists and user is the organizer
    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
        organizerId: session.user.id, // Only allow the event organizer to access
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found or you don\'t have permission to view registrations' }, { status: 404 });
    }

    // Fetch registrations for this event
    const registrations = await prisma.eventRegistration.findMany({
      where: {
        eventId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: {
        registrationDate: 'desc',
      },
    });

    // Format registrations for easier use on the frontend
    const formattedRegistrations = registrations.map(reg => ({
      id: reg.id,
      status: reg.status,
      registrationDate: reg.registrationDate,
      guestsCount: reg.guestsCount,
      notes: reg.notes,
      name: reg.user.name,
      email: reg.user.email,
      phone: reg.user.phoneNumber,
      image: reg.user.image,
      userId: reg.user.id,
    }));

    return NextResponse.json(formattedRegistrations);
  } catch (error) {
    console.error('Error fetching event registrations:', error);
    return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 });
  }
} 