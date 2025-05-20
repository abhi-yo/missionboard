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
  userId: z.string().cuid({ message: "Invalid User ID" }),
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

    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { 
          select: { 
            id: true,
            name: true,
            email: true 
          } 
        },
        subscription: {
          select: {
            id: true,
            plan: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("[/api/payments GET] Error fetching payments:", error);
    return NextResponse.json({ message: "Failed to fetch payments" }, { status: 500 });
  }
}

// POST - Create a new payment
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = paymentCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ 
        message: "Validation failed", 
        errors: validation.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { amount, currency, userId, subscriptionId, status, method, description } = validation.data;

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check if subscription exists if provided
    if (subscriptionId) {
      const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
      if (!subscription) {
        return NextResponse.json({ message: "Subscription not found" }, { status: 404 });
      }
    }

    // Create the payment
    const payment = await prisma.payment.create({
      data: {
        amount,
        currency,
        userId,
        subscriptionId,
        status,
        method,
        description,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        subscription: {
          select: {
            id: true,
            plan: {
              select: { name: true }
            }
          }
        }
      }
    });

    // Update the lastPayment field for the user
    await prisma.user.update({
      where: { id: userId },
      data: { lastPayment: new Date() }
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json({ message: "Failed to create payment" }, { status: 500 });
  }
} 