import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { EventStatus, RegistrationStatus } from '@/lib/generated/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const eventId = params.id;
    
    // Validate request body
    const body = await request.json();
    const { guestsCount = 0, notes = '' } = body;
    
    // Validate the event exists and is available for registration
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        registrations: {
          where: {
            status: {
              in: [RegistrationStatus.CONFIRMED, RegistrationStatus.ATTENDED]
            }
          },
          select: {
            guestsCount: true
          }
        }
      }
    });
    
    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }
    
    if (event.status !== EventStatus.SCHEDULED) {
      return NextResponse.json(
        { message: "Event is not open for registration" }, 
        { status: 400 }
      );
    }
    
    // Check if registration deadline has passed
    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      return NextResponse.json(
        { message: "Registration deadline has passed" }, 
        { status: 400 }
      );
    }
    
    // Check if the user is already registered
    const existingRegistration = await prisma.eventRegistration.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId
        }
      }
    });
    
    if (existingRegistration) {
      // Update existing registration if it was previously cancelled
      if (existingRegistration.status === RegistrationStatus.CANCELED_BY_USER || 
          existingRegistration.status === RegistrationStatus.CANCELED_BY_ADMIN) {
        
        const updatedRegistration = await prisma.eventRegistration.update({
          where: { id: existingRegistration.id },
          data: {
            status: RegistrationStatus.CONFIRMED,
            guestsCount: guestsCount,
            notes: notes
          }
        });
        
        return NextResponse.json(updatedRegistration);
      }
      
      return NextResponse.json(
        { message: "You are already registered for this event" }, 
        { status: 400 }
      );
    }
    
    // Check if event has capacity and if it's full
    if (event.capacity) {
      const currentAttendees = event.registrations.reduce(
        (sum, reg) => sum + reg.guestsCount + 1, 
        0
      );
      
      const requestedSpots = guestsCount + 1;
      
      if (currentAttendees + requestedSpots > event.capacity) {
        // Put on waitlist if full
        const registration = await prisma.eventRegistration.create({
          data: {
            eventId,
            userId,
            status: RegistrationStatus.WAITLISTED,
            guestsCount,
            notes
          }
        });
        
        return NextResponse.json({ 
          ...registration, 
          message: "Event is full. You have been added to the waitlist." 
        });
      }
    }
    
    // Create the registration
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        userId,
        status: RegistrationStatus.CONFIRMED,
        guestsCount,
        notes
      }
    });
    
    return NextResponse.json(registration);
    
  } catch (error) {
    console.error("Error registering for event:", error);
    return NextResponse.json(
      { message: "Failed to register for event" }, 
      { status: 500 }
    );
  }
}

// Cancel a registration
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const eventId = params.id;
    
    // Find the user's registration
    const registration = await prisma.eventRegistration.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId
        }
      }
    });
    
    if (!registration) {
      return NextResponse.json(
        { message: "You are not registered for this event" }, 
        { status: 404 }
      );
    }
    
    // Cancel the registration
    const cancelledRegistration = await prisma.eventRegistration.update({
      where: { id: registration.id },
      data: {
        status: RegistrationStatus.CANCELED_BY_USER
      }
    });
    
    // If there's a waitlist, promote the next person
    if (cancelledRegistration.status === RegistrationStatus.CONFIRMED) {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          registrations: {
            where: {
              status: RegistrationStatus.WAITLISTED
            },
            orderBy: {
              registrationDate: 'asc'
            },
            take: 1
          }
        }
      });
      
      if (event?.registrations.length) {
        const nextRegistration = event.registrations[0];
        
        await prisma.eventRegistration.update({
          where: { id: nextRegistration.id },
          data: {
            status: RegistrationStatus.CONFIRMED
          }
        });
      }
    }
    
    return NextResponse.json(cancelledRegistration);
    
  } catch (error) {
    console.error("Error cancelling registration:", error);
    return NextResponse.json(
      { message: "Failed to cancel registration" }, 
      { status: 500 }
    );
  }
} 