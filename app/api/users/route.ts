import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { MemberStatus, MemberRole } from '@/lib/generated/prisma'; // Import enums

export const dynamic = 'force-dynamic';

// Zod schema for user creation
// Note: emailVerified, image are handled by NextAuth OAuth flow primarily
const userSchema = z.object({
  name: z.string().min(1, { message: "Full name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  phoneNumber: z.string().optional(),
  // avatar is now 'image' in the model, but input might still be avatarUrl from a form
  image: z.string().url({ message: "Invalid URL for avatar" }).optional().or(z.literal('')),
  status: z.nativeEnum(MemberStatus), 
  role: z.nativeEnum(MemberRole),
  joinDate: z.string().datetime({ message: "Invalid date format for join date" }).optional(), // Made optional as it has a default
  notes: z.string().optional(),
});

const userCreateSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  status: z.string(),
  phoneNumber: z.string().optional(),
  joinDate: z.string().or(z.date()).optional(),
  notes: z.string().optional(),
});

export async function GET() {
  console.log("[/api/users GET] Attempting to fetch users.");
  try {
    const session = await getServerSession(authOptions);
    console.log("[/api/users GET] Session object:", JSON.stringify(session, null, 2));
    
    if (!session) {
      console.error("[/api/users GET] Unauthorized: No session found.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Add a more specific check, e.g., if a user ID is expected in the session
    if (!session.user || !session.user.id) {
      console.error("[/api/users GET] Unauthorized: Session found, but user or user.id is missing.", JSON.stringify(session.user, null, 2));
      return NextResponse.json({ error: "Unauthorized: Incomplete session data" }, { status: 401 });
    }

    console.log(`[/api/users GET] Session valid for user ID: ${session.user.id}. Fetching users from DB.`);
    
    // Fetch all users except the currently logged-in user
    const users = await prisma.user.findMany({
      where: {
        id: {
          not: session.user.id // Exclude the currently logged-in user
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("[USERS_GET]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    const validation = userCreateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors }, { status: 400 });
    }

    const { name, email, status, phoneNumber, joinDate, notes } = validation.data;

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        status: status as MemberStatus,
        role: MemberRole.ADMIN, // Always set to ADMIN
        phoneNumber,
        joinDate: joinDate ? new Date(joinDate) : new Date(),
        notes,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[USERS_POST]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
} 