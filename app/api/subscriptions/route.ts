import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { SubscriptionStatus } from '@/lib/generated/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

const subscriptionCreateSchema = z.object({
  userId: z.string().cuid({ message: "Invalid User ID" }),
  planId: z.string().cuid({ message: "Invalid Plan ID" }),
  // For simplicity, we'll set status and dates automatically for now.
  // More complex logic might involve Stripe webhooks or manual settings.
  // status: z.nativeEnum(SubscriptionStatus).optional().default(SubscriptionStatus.ACTIVE),
  // currentPeriodStart: z.string().datetime().optional(), // Or calculate based on plan
  // currentPeriodEnd: z.string().datetime().optional(),   // Or calculate based on plan
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = subscriptionCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Validation failed", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { userId, planId } = validation.data;

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

    const startDate = new Date();
    const currentPeriodStart = new Date();
    let currentPeriodEnd = new Date();
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

export async function GET(request: Request) {
    console.log("[/api/subscriptions GET] Attempting to fetch subscriptions.");
    try {
        const session = await getServerSession(authOptions);
        console.log("[/api/subscriptions GET] Session object:", JSON.stringify(session, null, 2));

        if (!session || !session.user?.id) {
            console.error("[/api/subscriptions GET] Unauthorized: No session or user ID found.");
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        console.log(`[/api/subscriptions GET] Session valid for user ID: ${session.user.id}. Fetching subscriptions for this user.`);
        const subscriptions = await prisma.subscription.findMany({
            where: {
                userId: session.user.id 
            },
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id:true, name: true, email: true } },
                plan: { select: { id:true, name: true, price: true, interval: true, currency: true } },
            }
        });
        console.log(`[/api/subscriptions GET] Fetched subscriptions count for user ${session.user.id}:`, subscriptions.length);
        return NextResponse.json(subscriptions);
    } catch (error) {
        console.error("[/api/subscriptions GET] Error fetching subscriptions:", error);
        return NextResponse.json({ message: "Failed to fetch subscriptions" }, { status: 500 });
    }
} 