import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { BillingInterval, MemberRole } from '@/lib/generated/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

const planSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().optional(),
  price: z.number().positive({ message: "Price must be a positive number" }),
  currency: z.string().default('USD'),
  interval: z.nativeEnum(BillingInterval),
  features: z.array(z.string()).optional().default([]),
  active: z.boolean().default(true),
  stripePriceId: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
        where: { id: session.user.id }
    });

    if (!adminUser || adminUser.role !== MemberRole.ADMIN) {
        return NextResponse.json({ message: "Forbidden: Insufficient privileges or role mismatch" }, { status: 403 });
    }

    const plans = await prisma.membershipPlan.findMany({
      where: {
        OR: [
          { createdById: session.user.id },
        ],
        active: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(plans);
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json({ message: "Failed to fetch plans" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id }, 
    });

    if (!adminUser || adminUser.role !== MemberRole.ADMIN) {
      return NextResponse.json({ message: "Forbidden: Insufficient privileges or role mismatch" }, { status: 403 });
    }

    const body = await request.json();
    const validation = planSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Validation failed", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const data = validation.data;

    const newPlan = await prisma.membershipPlan.create({
      data: {
        ...data,
        createdById: adminUser.id,
      },
    });
    return NextResponse.json(newPlan, { status: 201 });
  } catch (error) {
    console.error("Error creating plan:", error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: "Bad Request: Invalid JSON" }, { status: 400 });
    }
    return NextResponse.json({ message: "Failed to create plan" }, { status: 500 });
  }
} 