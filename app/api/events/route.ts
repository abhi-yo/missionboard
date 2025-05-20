import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { EventStatus } from '@/lib/generated/prisma';

export const dynamic = 'force-dynamic';

// GET - Get all events for the logged in user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Get all events where the user is the organizer
    const events = await prisma.event.findMany({
      where: {
        organizerId: userId
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        registrations: {
          select: {
            id: true,
            status: true,
            registrationDate: true,
            guestsCount: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        },
        eventImage: true
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Categorize and format the events for the frontend
    const formattedEvents = events.map(event => {
      const confirmedRegistrations = event.registrations.filter(reg => 
        reg.status === 'CONFIRMED' || reg.status === 'ATTENDED'
      );
      
      const attendeeCount = confirmedRegistrations.reduce((sum, reg) => sum + reg.guestsCount + 1, 0);
      
      // Determine a simple status category for the frontend
      let statusCategory: 'upcoming' | 'past' | 'canceled';
      if (event.status === EventStatus.CANCELED) {
        statusCategory = 'canceled';
      } else if (event.date < new Date()) {
        statusCategory = 'past';
      } else {
        statusCategory = 'upcoming';
      }
      
      // Set the image URL properly - first try the relation, then fallback to coverImage
      const imageUrl = event.eventImage 
        ? `/api/images/${event.eventImage.id}`
        : event.coverImage || '';
      
      return {
        id: event.id,
        title: event.name,
        description: event.description || '',
        date: event.date.toISOString(),
        endDate: event.endDate?.toISOString() || null,
        time: formatEventTime(event.date, event.endDate),
        location: event.location || 'TBD',
        locationDetails: event.locationDetails || '',
        capacity: event.capacity || 0,
        registered: attendeeCount,
        status: statusCategory,
        eventStatus: event.status,
        isPrivate: event.isPrivate,
        registrationDeadline: event.registrationDeadline?.toISOString() || null,
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
        image: imageUrl,
      };
    });

    return NextResponse.json(formattedEvents);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ message: "Failed to fetch events" }, { status: 500 });
  }
}

// POST - Create a new event
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    
    try {
      // Parse the JSON body
      const body = await request.json();
      
      // Extract and validate the event data
      const {
        title,
        description,
        date,
        endDate,
        location,
        locationDetails,
        capacity,
        isPrivate = false,
        registrationDeadline,
        image,
        eventImageId
      } = body;
      
      // Validate required fields
      if (!title) {
        return NextResponse.json({ message: "Event title is required" }, { status: 400 });
      }
      
      if (!date) {
        return NextResponse.json({ message: "Event date is required" }, { status: 400 });
      }
      
      try {
        // Convert date string to Date object to validate it
        new Date(date);
      } catch (dateError) {
        return NextResponse.json({ message: "Invalid event date format" }, { status: 400 });
      }
      
      // Create the event with proper handling of optional fields
      const event = await prisma.event.create({
        data: {
          name: title,
          description: description || null,
          date: new Date(date),
          endDate: endDate ? new Date(endDate) : null,
          location: location || null,
          locationDetails: locationDetails || null,
          capacity: capacity ? parseInt(capacity) : null,
          isPrivate: Boolean(isPrivate),
          registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
          coverImage: image || null,
          eventImage: eventImageId ? {
            connect: {
              id: eventImageId
            }
          } : undefined,
          status: EventStatus.SCHEDULED,
          organizer: {
            connect: {
              id: userId
            }
          }
        }
      });
      
      return NextResponse.json(event, { status: 201 });
    } catch (parseError: any) {
      console.error("Error parsing event data:", parseError);
      return NextResponse.json({ 
        message: "Invalid request data", 
        details: parseError.message 
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error creating event:", error);
    return NextResponse.json({ 
      message: "Failed to create event", 
      details: error.message || "Unknown error" 
    }, { status: 500 });
  }
}

// Helper function to format the event time for display
function formatEventTime(startDate: Date, endDate: Date | null): string {
  const start = new Date(startDate);
  
  // Format start time
  const startTime = start.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  // If no end date, just return start time
  if (!endDate) return startTime;
  
  const end = new Date(endDate);
  
  // Format end time
  const endTime = end.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  return `${startTime} - ${endTime}`;
} 