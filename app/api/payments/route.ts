import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { PaymentMethod, PaymentStatus } from '@/lib/generated/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

// Schema for payment creation
const paymentCreateSchema = z.object({
  amount: z.number().positive({ message: "Amount must be positive" }),
  currency: z.string().default('USD'),
  memberId: z.string().cuid({ message: "Invalid Member ID" }).optional(),
  subscriptionId: z.string().cuid({ message: "Invalid Subscription ID" }).optional(),
  status: z.nativeEnum(PaymentStatus).default('COMPLETED'),
  method: z.nativeEnum(PaymentMethod).default('OTHER'),
  description: z.string().optional(),
});

// GET - List all payments
export async function GET(request: Request) {
  console.log("[/api/payments GET] Attempting to fetch payments.");
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get the organization for this admin
    const organization = await prisma.organization.findUnique({
      where: { adminId: session.user.id },
      select: { id: true }
    });

    if (!organization) {
      return NextResponse.json({ message: "Organization not found" }, { status: 404 });
    }

    // Get all payments for this organization
    const payments = await prisma.payment.findMany({
      where: {
        organizationId: organization.id
      },
      include: {
        initiatedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        organization: true,
        subscription: {
          select: {
            id: true,
            plan: {
              select: {
                name: true
              }
            }
          }
        },
        member: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("[/api/payments GET] Error:", error);
    return NextResponse.json({ message: "Failed to fetch payments" }, { status: 500 });
  }
}

// POST - Create a new payment
export async function POST(request: Request) {
  console.log("[/api/payments POST] Attempting to create a payment");
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("[/api/payments POST] Request body:", body);
    
    // Validate the input
    const validation = paymentCreateSchema.safeParse(body);
    if (!validation.success) {
      console.error("[/api/payments POST] Validation error:", validation.error);
      return NextResponse.json({ message: "Invalid input", errors: validation.error.format() }, { status: 400 });
    }

    const { amount, currency, memberId, subscriptionId, status, method, description } = validation.data;

    // Check if subscription exists if provided
    if (subscriptionId) {
      const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
      if (!subscription) {
        return NextResponse.json({ message: "Subscription not found" }, { status: 404 });
      }
    }
    
    // Check if member exists if provided
    if (memberId) {
      const member = await prisma.member.findUnique({ where: { id: memberId } });
      if (!member) {
        return NextResponse.json({ message: "Member not found" }, { status: 404 });
      }
    }

    // Get the organization for this admin
    const organization = await prisma.organization.findUnique({
      where: { adminId: session.user.id },
      select: { id: true }
    });

    if (!organization) {
      return NextResponse.json({ message: "Organization not found" }, { status: 404 });
    }

    // Create the payment
    const payment = await prisma.payment.create({
      data: {
        amount,
        currency,
        initiatedBy: {
          connect: {
            id: session.user.id
          }
        },
        organization: {
          connect: {
            id: organization.id
          }
        },
        subscription: subscriptionId ? {
          connect: {
            id: subscriptionId
          }
        } : undefined,
        // Connect to member if memberId is provided
        member: memberId ? {
          connect: {
            id: memberId
          }
        } : undefined,
        status,
        method,
        description,
      },
      include: {
        initiatedBy: { select: { id: true, name: true, email: true } },
        organization: true,
        subscription: {
          select: {
            id: true,
            plan: {
              select: { name: true }
            }
          }
        },
        member: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Update the lastPayment field for the user
    await prisma.user.update({
      where: { id: session.user.id },
      data: { lastPayment: new Date() }
    });

    console.log("[/api/payments POST] Payment created:", payment);
    return NextResponse.json(payment);

  } catch (error) {
    console.error("[/api/payments POST] Error:", error);
    return NextResponse.json({ message: "Failed to create payment" }, { status: 500 });
  }
} 