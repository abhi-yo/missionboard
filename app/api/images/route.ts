import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// Set body size limit to 10MB
export const dynamic = 'force-dynamic';
export const maxDuration = 30; // 30 seconds
export const runtime = 'nodejs';

// POST - Create a new image
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the JSON body to get the image data
    const body = await request.json();
    
    // Validate that required fields are present
    if (!body.data || !body.mimeType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    try {
      // Decode base64 data to binary
      const base64Data = body.data.split(',')[1]; // Remove the data URL prefix
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Create image record in database with properly typed binary data
      const image = await prisma.image.create({
        data: {
          data: new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength),
          mimeType: body.mimeType,
          filename: body.filename || 'image',
          size: buffer.length,
          width: body.width || null,
          height: body.height || null,
          alt: body.alt || null,
          url: `/api/images/${crypto.randomUUID()}`, // Generate a URL for API access
        }
      });
      
      return NextResponse.json({ 
        id: image.id,
        mimeType: image.mimeType,
        size: image.size,
        width: image.width,
        height: image.height
      }, { status: 201 });
    } catch (innerError) {
      console.error('Error processing image data:', innerError);
      return NextResponse.json({ error: 'Failed to process image data' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
} 