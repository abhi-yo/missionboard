import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { MemberStatus } from '@/lib/generated/prisma';

export const dynamic = 'force-dynamic';

// Create a schema for validating user updates
const userUpdateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  status: z.string().optional(),
  phoneNumber: z.string().nullable().optional(),
  joinDate: z.string().optional(),
  notes: z.string().nullable().optional(),
});

// GET a user by ID
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = params.id;

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if the requesting user has permission to view this user
    // For now, we use our workaround to check if this user was created by the current user
    const isCreatedByCurrentAdmin = user.notes && user.notes.includes(`Created by: ${session.user.id}`);
    const isSelf = user.id === session.user.id;
    
    // Only allow access if the user is viewing themselves or a user they created
    if (!isSelf && !isCreatedByCurrentAdmin) {
      return NextResponse.json({ message: "Unauthorized: This user doesn't belong to your organization" }, { status: 403 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("[USER_GET]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// UPDATE a user by ID
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = params.id;
    const body = await req.json();
    
    const validation = userUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors }, { status: 400 });
    }

    const { name, email, status, phoneNumber, joinDate, notes } = validation.data;

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if the requesting user has permission to update this user
    // For now, we use our workaround to check if this user was created by the current user
    const isCreatedByCurrentAdmin = user.notes && user.notes.includes(`Created by: ${session.user.id}`);
    const isSelf = user.id === session.user.id;
    
    if (!isSelf && !isCreatedByCurrentAdmin) {
      return NextResponse.json({ message: "Unauthorized: You cannot update users that don't belong to your organization" }, { status: 403 });
    }

    if (email && email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (existingUser) {
        return NextResponse.json({ error: "Email already in use" }, { status: 400 });
      }
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(status && { status: status as MemberStatus }),
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(joinDate && { joinDate: new Date(joinDate) }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[USER_PUT]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// DELETE a user by ID
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = params.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if the requesting user has permission to delete this user
    // For now, we use our workaround to check if this user was created by the current user
    const isCreatedByCurrentAdmin = user.notes && user.notes.includes(`Created by: ${session.user.id}`);
    
    // Users should not be able to delete themselves
    if (user.id === session.user.id) {
      return NextResponse.json({ message: "Cannot delete your own account" }, { status: 403 });
    }
    
    // Only allow deletion if the user was created by the current admin
    if (!isCreatedByCurrentAdmin) {
      return NextResponse.json({ message: "Unauthorized: You cannot delete users that don't belong to your organization" }, { status: 403 });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[USER_DELETE]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
} 