import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { BillingInterval } from '@/lib/generated/prisma';

export const dynamic = 'force-dynamic';

// Schema for updating a plan (all fields optional, but if provided, must match type)
// For PUT, we usually allow partial updates, so .optional() is key.
const planUpdateSchema = z.object({
  name: z.string().min(1, { message: "Name cannot be empty" }).optional(),
  description: z.string().optional().nullable(), // Allow explicitly setting to null
  price: z.number().positive({ message: "Price must be a positive number" }).optional(),
  currency: z.string().optional(),
  interval: z.nativeEnum(BillingInterval).optional(),
  features: z.array(z.string()).optional(),
  active: z.boolean().optional(),
  stripePriceId: z.string().optional().nullable(), // Allow explicitly setting to null or new string
});

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const plan = await prisma.membershipPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      return NextResponse.json({ message: "Plan not found" }, { status: 404 });
    }
    return NextResponse.json(plan);
  } catch (error) {
    console.error(`Error fetching plan ${params.id}:`, error);
    return NextResponse.json({ message: "Failed to fetch plan" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await request.json();
    const validation = planUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Validation failed", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const dataToUpdate = validation.data;

    // Ensure at least one field is being updated
    if (Object.keys(dataToUpdate).length === 0) {
        return NextResponse.json({ message: "No fields provided for update" }, { status: 400 });
    }

    const updatedPlan = await prisma.membershipPlan.update({
      where: { id },
      data: dataToUpdate, // Prisma handles partial updates correctly with validated optional fields
    });
    return NextResponse.json(updatedPlan);
  } catch (error: any) {
    console.error(`Error updating plan ${params.id}:`, error);
    if (error.code === 'P2025') { // Prisma error code for record not found during update
        return NextResponse.json({ message: "Plan not found" }, { status: 404 });
    }
    // Handle unique constraint violation for stripePriceId if necessary
    // if (error.code === 'P2002' && error.meta?.target?.includes('stripePriceId')) {
    //     return NextResponse.json({ message: "Another plan with this Stripe Price ID already exists." }, { status: 409 });
    // }
    return NextResponse.json({ message: "Failed to update plan" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    await prisma.membershipPlan.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Plan deleted successfully" }, { status: 200 }); // Or 204 No Content
  } catch (error: any) {
    console.error(`Error deleting plan ${params.id}:`, error);
    if (error.code === 'P2025') { // Prisma error code for record not found during delete
        return NextResponse.json({ message: "Plan not found" }, { status: 404 });
    }
     // Handle related records if plan deletion is restricted (e.g., active subscriptions)
    if (error.code === 'P2003') { // Foreign key constraint failed
        return NextResponse.json({ message: "Cannot delete plan. It may have active subscriptions or other related records." }, { status: 409 });
    }
    return NextResponse.json({ message: "Failed to delete plan" }, { status: 500 });
  }
} 