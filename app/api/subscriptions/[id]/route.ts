import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { SubscriptionStatus } from '@/lib/generated/prisma';

export const dynamic = 'force-dynamic';

// Schema for updating a subscription (partial updates)
const subscriptionUpdateSchema = z.object({
  planId: z.string().cuid({ message: "Invalid Plan ID" }).optional(), // Allow changing plan
  status: z.nativeEnum(SubscriptionStatus).optional(),
  currentPeriodStart: z.string().datetime({ message: "Invalid date format" }).optional().transform((date) => date ? new Date(date) : undefined),
  currentPeriodEnd: z.string().datetime({ message: "Invalid date format" }).optional().transform((date) => date ? new Date(date) : undefined),
  cancelAtPeriodEnd: z.boolean().optional(),
  canceledAt: z.string().datetime({ message: "Invalid date format" }).optional().nullable().transform((date) => date ? new Date(date) : null),
  trialStartDate: z.string().datetime({ message: "Invalid date format" }).optional().nullable().transform((date) => date ? new Date(date) : null),
  trialEndDate: z.string().datetime({ message: "Invalid date format" }).optional().nullable().transform((date) => date ? new Date(date) : null),
  // stripeSubscriptionId should generally not be updated manually here post-creation
});

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        member: { select: { id: true, name: true, email: true } },
        plan: true, // Include full plan details
      },
    });

    if (!subscription) {
      return NextResponse.json({ message: "Subscription not found" }, { status: 404 });
    }
    return NextResponse.json(subscription);
  } catch (error) {
    console.error(`Error fetching subscription ${params.id}:`, error);
    return NextResponse.json({ message: "Failed to fetch subscription" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await request.json();
    const validation = subscriptionUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Validation failed", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const dataToUpdate = validation.data;

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ message: "No fields provided for update" }, { status: 400 });
    }

    // If planId is being updated, verify the new plan exists and is active
    if (dataToUpdate.planId) {
        const plan = await prisma.membershipPlan.findUnique({ where: { id: dataToUpdate.planId } });
        if (!plan) {
            return NextResponse.json({ message: "New membership plan not found" }, { status: 404 });
        }
        if (!plan.active) {
            return NextResponse.json({ message: "Cannot switch subscription to an inactive plan" }, { status: 400 });
        }
        // If changing plan, may need to recalculate period end/start based on new plan's interval if not provided
        // For now, assumes these are provided if changed, or handled by more complex logic.
    }

    const updatedSubscription = await prisma.subscription.update({
      where: { id },
      data: dataToUpdate,
      include: {
        member: { select: { id: true, name: true, email: true } },
        plan: true,
      },
    });
    return NextResponse.json(updatedSubscription);
  } catch (error: any) {
    console.error(`Error updating subscription ${params.id}:`, error);
    if (error.code === 'P2025') { 
        return NextResponse.json({ message: "Subscription not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Failed to update subscription" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    // First check if the subscription exists
    const subscription = await prisma.subscription.findUnique({ where: { id } });
    if (!subscription) {
      return NextResponse.json({ message: "Subscription not found" }, { status: 404 });
    }

    await prisma.subscription.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Subscription deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error(`Error deleting subscription ${params.id}:`, error);
    if (error.code === 'P2025') {
        return NextResponse.json({ message: "Subscription not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Failed to delete subscription" }, { status: 500 });
  }
} 