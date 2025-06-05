import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { BillingInterval } from '@/lib/generated/prisma';
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
      return NextResponse.json({ 
        error: "Unauthorized",
        details: "Please log in to access this resource"
      }, { status: 401 });
    }

    const adminUserWithOrg = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { organization: { select: { id: true } } }
    }).catch(err => {
      console.error(`[/api/plans GET] Database error finding admin user: ${err.message}`);
      throw new Error(`Database error: ${err.message}`);
    });

    if (!adminUserWithOrg?.organization?.id) {
        console.log("[/api/plans GET] Admin user or their organization not found:", session.user.id);
        return NextResponse.json({ 
          error: "No organization found",
          details: "Admin user or their organization not found. Please create an organization or contact support."
        }, { status: 404 });
    }
    const organizationId = adminUserWithOrg.organization.id;

    console.log("[/api/plans GET] Fetching plans for organization:", organizationId);
    const plans = await prisma.membershipPlan.findMany({
      where: {
        organizationId: organizationId,
      },
      orderBy: { createdAt: 'desc' },
    }).catch(err => {
      console.error(`[/api/plans GET] Database error fetching plans: ${err.message}`);
      throw new Error(`Error fetching plans: ${err.message}`);
    });
    
    console.log(`[/api/plans GET] Found ${plans.length} plans for organization ${organizationId}`);
    return NextResponse.json(plans);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[/api/plans GET] Error: ${errorMessage}`);
    return NextResponse.json({ 
      error: "Failed to fetch plans", 
      details: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    console.log("[/api/plans POST] Attempting to create plan");
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log("[/api/plans POST] Unauthorized: No session or user ID");
      return NextResponse.json({ 
        error: "Unauthorized",
        details: "Please log in to access this resource" 
      }, { status: 401 });
    }

    const adminUserWithOrg = await prisma.user.findUnique({
      where: { id: session.user.id }, 
      select: { id: true, organization: { select: { id: true } } }
    }).catch(err => {
      console.error(`[/api/plans POST] Database error finding admin user: ${err.message}`);
      throw new Error(`Database error: ${err.message}`);
    });

    if (!adminUserWithOrg?.organization?.id) {
      console.log("[/api/plans POST] Admin user or their organization not found:", session.user.id);
      return NextResponse.json({ 
        error: "No organization found",
        details: "Admin user or their organization not found. Please create an organization first." 
      }, { status: 404 });
    }
    const organizationId = adminUserWithOrg.organization.id;

    // Parse request body with more detailed error handling
    let body;
    try {
      const text = await request.text();
      console.log("[/api/plans POST] Raw request body:", text);
      
      // Handle empty body case
      if (!text || text.trim() === '') {
        return NextResponse.json({ 
          error: "Empty request body", 
          details: "Request body cannot be empty" 
        }, { status: 400 });
      }
      
      // Try to parse JSON
      body = JSON.parse(text);
      console.log("[/api/plans POST] Parsed request body:", JSON.stringify(body));
    } catch (err) {
      console.error("[/api/plans POST] JSON parse error:", err);
      return NextResponse.json({ 
        error: "Invalid JSON", 
        details: err instanceof Error ? err.message : "Could not parse request body" 
      }, { status: 400 });
    }

    // Special handling for price field
    if (typeof body.price === 'string') {
      try {
        body.price = parseFloat(body.price);
        console.log("[/api/plans POST] Converted price from string to number:", body.price);
      } catch (err) {
        console.error("[/api/plans POST] Price conversion error:", err);
      }
    }

    const validation = planSchema.safeParse(body);

    if (!validation.success) {
      console.log("[/api/plans POST] Validation failed:", JSON.stringify(validation.error.errors));
      return NextResponse.json({ 
        error: "Validation failed", 
        details: validation.error.flatten().fieldErrors 
      }, { status: 400 });
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
    }).catch(err => {
      console.error(`[/api/plans POST] Database error creating plan: ${err.message}`);
      throw new Error(`Error creating plan: ${err.message}`);
    });
    
    console.log("[/api/plans POST] Plan created successfully:", newPlan.id, "for org", organizationId);
    return NextResponse.json(newPlan, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[/api/plans POST] Error: ${errorMessage}`);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ 
          error: "Bad Request", 
          details: "Invalid JSON" 
        }, { status: 400 });
    }
    return NextResponse.json({ 
      error: "Failed to create plan", 
      details: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 