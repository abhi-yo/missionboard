import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { SubscriptionStatus } from '@/lib/generated/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

const subscriptionCreateSchema = z.object({
  memberId: z.string().cuid({ message: "Invalid Member ID" }).optional(),
  planId: z.string().cuid({ message: "Invalid Plan ID" }),
  customStartDate: z.string().datetime({ message: "Invalid start date" }).optional(),
});

export async function GET(request: Request) {
  console.log("[/api/manage/subscriptions GET] Attempting to fetch all subscriptions.");
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!adminUser || !adminUser.organization?.id) {
      console.error(`[/api/manage/subscriptions GET] Admin user ${session.user.id} or their organization not found.`);
      return NextResponse.json({ message: "Forbidden: Admin or Organization not found" }, { status: 403 });
    }

    const subscriptions = await prisma.subscription.findMany({
      where: { organizationId: adminUser.organization.id },
      orderBy: { createdAt: 'desc' },
      include: {
        managedBy: { select: { id: true, name: true, email: true } },
        plan: { select: { id: true, name: true, price: true, interval: true, currency: true } },
        member: { select: { id: true, name: true, email: true } }
      }
    });

    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error("[/api/manage/subscriptions GET] Error fetching subscriptions:", error);
    return NextResponse.json({ message: "Failed to fetch subscriptions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const adminUserWithOrg = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, organization: { select: { id: true } } }
    });

    if (!adminUserWithOrg || !adminUserWithOrg.organization?.id) {
      console.error(`[/api/manage/subscriptions POST] Admin user ${session.user.id} or their organization not found.`);
      return NextResponse.json({ message: "Forbidden: Admin or Organization not found" }, { status: 403 });
    }
    const organizationId = adminUserWithOrg.organization.id;

    const body = await request.json();
    const validation = subscriptionCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Validation failed", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { memberId, planId, customStartDate } = validation.data;

    if (memberId) {
      const member = await prisma.member.findUnique({ where: { id: memberId, organizationId: organizationId } });
      if (!member) {
        return NextResponse.json({ message: "Member not found in your organization" }, { status: 404 });
      }
    }

    const plan = await prisma.membershipPlan.findUnique({ where: { id: planId, organizationId: organizationId } });
    if (!plan) {
      return NextResponse.json({ message: "Membership plan not found in your organization" }, { status: 404 });
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
    } else {
        console.warn(`Unknown billing interval: ${plan.interval} for plan ${planId}`);
        currentPeriodEnd.setMonth(currentPeriodStart.getMonth() + 1); 
    }
    
    const newSubscriptionData: any = {
      managedById: session.user.id,
      organizationId: organizationId,
      planId,
      status: SubscriptionStatus.ACTIVE,
      startDate,
      currentPeriodStart,
      currentPeriodEnd,
    };

    if (memberId) {
      newSubscriptionData.memberId = memberId;
    } else {
      newSubscriptionData.memberId = null;
    }

    const newSubscription = await prisma.subscription.create({
      data: newSubscriptionData,
      include: {
        managedBy: { select: { id: true, name: true, email: true } },
        plan: { select: { id: true, name: true, price: true, interval: true, currency: true } },
        organization: { select: { id: true, name: true } },
        member: { select: { id: true, name: true, email: true } }
      }
    });

    return NextResponse.json(newSubscription, { status: 201 });

  } catch (error) {
    console.error("Error creating subscription:", error);
    if (error instanceof z.ZodError) {
        return NextResponse.json({ message: "Validation failed", errors: error.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json({ message: "Failed to create subscription" }, { status: 500 });
  }
} 