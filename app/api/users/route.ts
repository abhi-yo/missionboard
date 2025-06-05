import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { MemberStatus } from '@/lib/generated/prisma'; // MemberRole removed

export const dynamic = 'force-dynamic';

// Zod schema for member creation
const memberCreateSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }).optional(), // Member email is optional
  status: z.nativeEnum(MemberStatus), // Use MemberStatus enum
  phoneNumber: z.string().optional(),
  joinDate: z.string().optional(), // Will be converted to Date
  notes: z.string().optional(),
});

export async function GET() {
  console.log("[/api/users GET] Attempting to fetch members.");
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.error("[/api/users GET] Unauthorized: No session or user ID.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the organization administered by the current user
    const organization = await prisma.organization.findUnique({
      where: { adminId: session.user.id },
      select: { id: true }
    }).catch(err => {
      console.error(`[/api/users GET] Database error finding organization: ${err.message}`);
      return null;
    });

    if (!organization) {
      console.error(`[/api/users GET] No organization found for admin ID: ${session.user.id}.`);
      return NextResponse.json({ 
        error: "User is not an admin of any organization or organization not found.",
        details: "You need to create an organization or be assigned as an admin."
      }, { status: 404 });
    }

    console.log(`[/api/users GET] Fetching members for organization ID: ${organization.id}.`);
    
    const members = await prisma.member.findMany({
      where: {
        organizationId: organization.id,
      },
      select: { // Select fields relevant for Member
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        status: true,
        joinDate: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    }).catch(err => {
      console.error(`[/api/users GET] Database error fetching members: ${err.message}`);
      throw new Error(`Failed to fetch members: ${err.message}`);
    });

    return NextResponse.json(members);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[/api/users GET] Error: ${errorMessage}`);
    return NextResponse.json({ 
      error: "Error fetching members", 
      details: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    console.log("[/api/users POST] Starting member creation");
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log("[/api/users POST] Unauthorized: No session or session.user.id");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the organization administered by the current user to associate the new member
    const organization = await prisma.organization.findUnique({
        where: { adminId: session.user.id },
        select: { id: true }
    }).catch(err => {
      console.error(`[/api/users POST] Database error finding organization: ${err.message}`);
      return null;
    });

    if (!organization) {
        console.log("[/api/users POST] Admin user not associated with an organization or organization not found");
        return NextResponse.json({ 
          error: "Admin user not associated with an organization",
          details: "You need to create or join an organization as an admin first"
        }, { status: 404 });
    }

    const body = await req.json();
    console.log("[/api/users POST] Received body for new member:", JSON.stringify(body, null, 2));
    
    const validation = memberCreateSchema.safeParse(body);
    if (!validation.success) {
      console.log("[/api/users POST] Validation failed for new member:", validation.error.errors);
      return NextResponse.json({ error: validation.error.errors }, { status: 400 });
    }

    const { name, email, status, phoneNumber, joinDate, notes } = validation.data;
    
    console.log("[/api/users POST] Creating member with data:", { 
      name, email, status, phoneNumber, joinDate, notes, organizationId: organization.id 
    });

    const member = await prisma.member.create({
      data: {
        name,
        email: email || null, // Ensure email is null if not provided
        status: status, // Already validated as MemberStatus by Zod
        phoneNumber: phoneNumber || null,
        joinDate: joinDate ? new Date(joinDate) : new Date(),
        notes: notes || "",
        organizationId: organization.id, // Associate with the admin's organization
      },
    }).catch(err => {
      console.error(`[/api/users POST] Database error creating member: ${err.message}`);
      throw new Error(`Failed to create member: ${err.message}`);
    });

    console.log("[/api/users POST] Member created successfully:", member.id);
    return NextResponse.json(member);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[/api/users POST] Error: ${errorMessage}`);
    return NextResponse.json({ 
      error: "Error creating member", 
      details: errorMessage,
      timestamp: new Date().toISOString() 
    }, { status: 500 });
  }
} 