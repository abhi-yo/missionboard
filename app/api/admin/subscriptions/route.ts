import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { MemberRole, SubscriptionStatus } from '@/lib/generated/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

const subscriptionCreateSchema = z.object({
  userId: z.string().cuid({ message: "Invalid User ID" }),
  planId: z.string().cuid({ message: "Invalid Plan ID" }),
  customStartDate: z.string().optional(),
});

export async function GET(request: Request) {
  console.log("[/api/admin/subscriptions GET] Attempting to fetch all subscriptions.");
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!adminUser || adminUser.role !== MemberRole.ADMIN) {
      return NextResponse.json({ message: "Forbidden: Insufficient privileges or role mismatch" }, { status: 403 });
    }

    const subscriptions = await prisma.subscription.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        plan: { select: { id: true, name: true, price: true, interval: true, currency: true } },
      }
    });

    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error("[/api/admin/subscriptions GET] Error fetching subscriptions:", error);
    return NextResponse.json({ message: "Failed to fetch subscriptions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!adminUser || adminUser.role !== MemberRole.ADMIN) {
      return NextResponse.json({ message: "Forbidden: Insufficient privileges or role mismatch" }, { status: 403 });
    }

    const body = await request.json();
    const validation = subscriptionCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Validation failed", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { userId, planId, customStartDate } = validation.data;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const plan = await prisma.membershipPlan.findUnique({ where: { id: planId } });
    if (!plan) {
      return NextResponse.json({ message: "Membership plan not found" }, { status: 404 });
    }
    if (!plan.active) {
      return NextResponse.json({ message: "Cannot subscribe to an inactive plan" }, { status: 400 });
    }

    const startDate = customStartDate ? new Date(customStartDate) : new Date();
    const currentPeriodStart = new Date(startDate);
    let currentPeriodEnd = new Date(startDate);
    
    if (plan.interval === 'MONTHLY') {
      currentPeriodEnd.setMonth(currentPeriodStart.getMonth() + 1);
    } else if (plan.interval === 'YEARLY') {
      currentPeriodEnd.setFullYear(currentPeriodStart.getFullYear() + 1);
    }

    const newSubscription = await prisma.subscription.create({
      data: {
        userId,
        planId,
        status: SubscriptionStatus.ACTIVE,
        startDate,
        currentPeriodStart,
        currentPeriodEnd,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        plan: { select: { id: true, name: true, price: true, interval: true, currency: true } },
      }
    });

    return NextResponse.json(newSubscription, { status: 201 });

  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json({ message: "Failed to create subscription" }, { status: 500 });
  }
} 