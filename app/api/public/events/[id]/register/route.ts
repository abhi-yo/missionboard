import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EventStatus, RegistrationStatus } from '@/lib/generated/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Schema for public registration
const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  guestsCount: z.number().int().min(0).default(0),
  notes: z.string().optional(),
  phone: z.string().optional(),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id;
    
    // Parse and validate request body
    const body = await request.json();
    const validation = registerSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', issues: validation.error.issues }, 
        { status: 400 }
      );
    }
    
    const { name, email, guestsCount, notes, phone } = validation.data;
    
    // Check if event exists and is available for registration
    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
        isPrivate: false, // Only public events can be registered through this endpoint
        status: EventStatus.SCHEDULED
      },
      include: {
        registrations: {
          where: {
            status: {
              in: [RegistrationStatus.CONFIRMED, RegistrationStatus.ATTENDED]
            }
          },
          select: {
            id: true,
            guestsCount: true
          }
        }
      }
    });
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found or not available for registration' }, 
        { status: 404 }
      );
    }
    
    // Check if registration deadline has passed
    if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
      return NextResponse.json(
        { error: 'Registration deadline has passed' }, 
        { status: 400 }
      );
    }
    
    // Check for existing registration with this email
    const existingRegistration = await prisma.eventRegistration.findFirst({
      where: {
        eventId,
        registrantEmail: email
      }
    });
    
    if (existingRegistration) {
      return NextResponse.json(
        { error: 'You are already registered for this event' }, 
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
        // Wait-list the registration if event is full
        // Create a waitlisted registration
        const registration = await prisma.eventRegistration.create({
          data: {
            eventId,
            registrantName: name,
            registrantEmail: email,
            status: RegistrationStatus.WAITLISTED,
            guestsCount,
            notes,
            organizationId: event.organizationId as string, // Required in schema
          }
        });
        
        return NextResponse.json({
          message: 'Event is full. You have been added to the waitlist.',
          registration: {
            id: registration.id,
            status: 'waitlisted'
          }
        });
      }
    }
    
    // Create the registration
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        registrantName: name,
        registrantEmail: email,
        status: RegistrationStatus.CONFIRMED,
        guestsCount,
        notes,
        organizationId: event.organizationId as string, // Required in schema
      }
    });
    
    return NextResponse.json({
      message: 'Registration successful!',
      registration: {
        id: registration.id,
        status: 'confirmed'
      }
    });
  } catch (error) {
    console.error('Error registering for event:', error);
    return NextResponse.json({ error: 'Failed to register for event' }, { status: 500 });
  }
}

// All TypeScript errors should be resolved now 