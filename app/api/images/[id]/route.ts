import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Fetch the image from the database
    const image = await prisma.image.findUnique({
      where: { id }
    });
    
    // If no image is found, return 404
    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }
    
    // Create a response with the binary data
    const response = new NextResponse(image.data);
    
    // Set appropriate headers
    response.headers.set('Content-Type', image.mimeType);
    response.headers.set('Content-Length', image.size.toString());
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable'); // Cache for 1 year
    
    return response;
  } catch (error) {
    console.error('Error fetching image:', error);
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
  }
} 