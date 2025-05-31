import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { BillingInterval, /* MemberRole removed as it's not used here */ } from '@/lib/generated/prisma';
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
    console.log("[/api/plans GET] Attempting to fetch plans");
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log("[/api/plans GET] Unauthorized: No session or user ID");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const adminUserWithOrg = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { organization: { select: { id: true } } }
    });

    if (!adminUserWithOrg?.organization?.id) {
        console.log("[/api/plans GET] Admin user or their organization not found:", session.user.id);
        return NextResponse.json({ message: "Admin user or their organization not found" }, { status: 404 });
    }
    const organizationId = adminUserWithOrg.organization.id;

    console.log("[/api/plans GET] Fetching plans for organization:", organizationId);
    const plans = await prisma.membershipPlan.findMany({
      where: {
        organizationId: organizationId,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    console.log(`[/api/plans GET] Found ${plans.length} plans for organization ${organizationId}`);
    return NextResponse.json(plans);
  } catch (error) {
    console.error("[/api/plans GET] Error fetching plans:", error);
    return NextResponse.json({ message: "Failed to fetch plans" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    console.log("[/api/plans POST] Attempting to create plan");
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log("[/api/plans POST] Unauthorized: No session or user ID");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const adminUserWithOrg = await prisma.user.findUnique({
      where: { id: session.user.id }, 
      select: { id: true, organization: { select: { id: true } } }
    });

    if (!adminUserWithOrg?.organization?.id) {
      console.log("[/api/plans POST] Admin user or their organization not found:", session.user.id);
      return NextResponse.json({ message: "Admin user or their organization not found" }, { status: 404 });
    }
    const organizationId = adminUserWithOrg.organization.id;

    const body = await request.json();
    const validation = planSchema.safeParse(body);

    if (!validation.success) {
      console.log("[/api/plans POST] Validation failed:", validation.error.errors);
      return NextResponse.json({ message: "Validation failed", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const data = validation.data;
    console.log("[/api/plans POST] Creating plan with data for organization:", organizationId, JSON.stringify(data));

    const newPlan = await prisma.membershipPlan.create({
      data: {
        ...data,
        price: data.price,
        createdById: adminUserWithOrg.id,
        organizationId: organizationId,
      },
    });
    
    console.log("[/api/plans POST] Plan created successfully:", newPlan.id, "for org", organizationId);
    return NextResponse.json(newPlan, { status: 201 });
  } catch (error) {
    console.error("[/api/plans POST] Error creating plan:", error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: "Bad Request: Invalid JSON" }, { status: 400 });
    }
    return NextResponse.json({ message: "Failed to create plan" }, { status: 500 });
  }
} 