import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  console.log("[/api/members GET] Attempting to fetch members.");
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.error("[/api/members GET] Unauthorized: No session or user ID.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the organization administered by the current user
    const organization = await prisma.organization.findUnique({
      where: { adminId: session.user.id },
      select: { id: true }
    });

    if (!organization) {
      console.error(`[/api/members GET] No organization found for admin ID: ${session.user.id}.`);
      return NextResponse.json({ error: "User is not an admin of any organization or organization not found." }, { status: 404 });
    }

    console.log(`[/api/members GET] Fetching members for organization ID: ${organization.id}.`);
    
    const members = await prisma.member.findMany({
      where: {
        organizationId: organization.id,
      },
      select: {
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
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("[/api/members GET]", error);
    return NextResponse.json({ error: "Internal error fetching members" }, { status: 500 });
  }
} 