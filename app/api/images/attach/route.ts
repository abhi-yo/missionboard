import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// PATCH - Attach an image to a user profile or event
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the JSON body
    const body = await request.json();
    
    // Validate that required fields are present
    if (!body.imageId) {
      return NextResponse.json({ error: 'Missing image ID' }, { status: 400 });
    }
    
    // Check if the image exists
    const image = await prisma.image.findUnique({
      where: { id: body.imageId }
    });
    
    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }
    
    // Attach image based on the target type
    if (body.targetType === 'user') {
      // Ensure we have a user ID
      const userId = body.userId || session.user.id;
      
      // Verify the current user can modify this user's profile
      if (userId !== session.user.id) {
        return NextResponse.json({ error: 'Not authorized to modify this user' }, { status: 403 });
      }
      
      // Update the user's profile image
      await prisma.user.update({
        where: { id: userId },
        data: { profileImageId: body.imageId }
      });
      
      return NextResponse.json({ 
        message: 'Profile image updated successfully',
        imageUrl: `/api/images/${body.imageId}`
      });
    } 
    else if (body.targetType === 'event') {
      // Ensure we have an event ID
      if (!body.eventId) {
        return NextResponse.json({ error: 'Missing event ID' }, { status: 400 });
      }
      
      try {
        // Verify the current user can modify this event
        const event = await prisma.event.findUnique({
          where: { id: body.eventId }
        });
        
        if (!event) {
          return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }
        
        // Verify ownership
        if (event.organizerId !== session.user.id) {
          return NextResponse.json({ 
            error: 'You do not have permission to modify this event' 
          }, { status: 403 });
        }
        
        // Update the event's cover image
        await prisma.event.update({
          where: { id: body.eventId },
          data: { eventImageId: body.imageId }
        });
        
        return NextResponse.json({ 
          message: 'Event image updated successfully',
          imageUrl: `/api/images/${body.imageId}`
        });
      } catch (eventError: any) {
        console.error('Error updating event image:', eventError);
        return NextResponse.json({ 
          error: 'Failed to update event image',
          details: eventError.message || 'Unknown error'
        }, { status: 500 });
      }
    }
    else {
      return NextResponse.json({ error: 'Invalid target type' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error attaching image:', error);
    return NextResponse.json({ 
      error: 'Failed to attach image',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
} 