import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { EventStatus, RegistrationStatus } from '@/lib/generated/prisma';

export const dynamic = 'force-dynamic';

// PATCH - Cancel an event
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
    
    // First check if the event exists and user is the organizer
    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
        organizerId: session.user.id, // Only allow the event organizer to cancel
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found or you don\'t have permission to cancel it' }, { status: 404 });
    }

    // Update event status to CANCELED
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        status: EventStatus.CANCELED,
      },
    });

    // Optional: Notify registered users about the cancellation
    // This would typically be done through an email service
    // For now, we'll just update registrations status to CANCELED_BY_ADMIN as well
    await prisma.eventRegistration.updateMany({
      where: {
        eventId,
        status: {
          in: [RegistrationStatus.CONFIRMED, RegistrationStatus.WAITLISTED],
        },
      },
      data: {
        status: RegistrationStatus.CANCELED_BY_ADMIN,
      },
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('Error canceling event:', error);
    return NextResponse.json({ error: 'Failed to cancel event' }, { status: 500 });
  }
} 