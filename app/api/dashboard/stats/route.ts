import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Get the organization for this user
    const organization = await prisma.organization.findUnique({
      where: { adminId: userId }
    });
    
    if (!organization) {
      return NextResponse.json({ message: "Organization not found" }, { status: 404 });
    }

    const organizationId = organization.id;

    // Get total members for this organization
    const totalMembers = await prisma.member.count({
      where: { organizationId }
    });

    // Get active subscriptions for this organization
    const activeSubscriptions = await prisma.subscription.count({
      where: { 
        organizationId,
        status: 'ACTIVE'
      }
    });

    // Get upcoming events for this organization
    const today = new Date();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const upcomingEvents = await prisma.event.count({
      where: {
        organizationId,
        date: {
          gte: today,
          lte: endOfMonth
        },
        status: 'SCHEDULED'
      }
    });

    // Get total revenue for this organization
    const payments = await prisma.payment.findMany({
      where: {
        organizationId,
        status: 'COMPLETED'
      },
      select: {
        amount: true
      }
    });

    const totalRevenue = payments.reduce((sum, payment) => 
      sum + Number(payment.amount), 0);

    return NextResponse.json({
      totalMembers,
      activeSubscriptions,
      upcomingEvents,
      totalRevenue
    });
  } catch (error) {
    console.error("[API/DASHBOARD/STATS] Error:", error);
    return NextResponse.json({ message: "Failed to fetch dashboard stats" }, { status: 500 });
  }
} 