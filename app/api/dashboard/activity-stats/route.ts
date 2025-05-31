import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

async function getDailyData(days: number, organizationId: string) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // Initialize data map with all dates in the range
  const dailyDataMap = new Map<string, { date: string; newUsers: number; revenue: number }>();
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
    dailyDataMap.set(dateStr, { date: dateStr, newUsers: 0, revenue: 0 });
  }

  // Fetch new members for this organization
  const members = await prisma.member.findMany({
    where: {
      organizationId: organizationId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      createdAt: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  members.forEach(member => {
    const dateStr = member.createdAt.toISOString().split('T')[0];
    if (dailyDataMap.has(dateStr)) {
      dailyDataMap.get(dateStr)!.newUsers++;
    }
  });

  // Fetch payments for revenue (for this organization)
  const payments = await prisma.payment.findMany({
    where: {
      organizationId: organizationId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      // Optionally, filter by status if you have one (e.g., COMPLETED)
      status: 'COMPLETED',
    },
    select: {
      amount: true,
      createdAt: true,
    },
  });

  payments.forEach(payment => {
    const dateStr = payment.createdAt.toISOString().split('T')[0];
    if (dailyDataMap.has(dateStr)) {
      dailyDataMap.get(dateStr)!.revenue += Number(payment.amount); // Convert Decimal to number
    }
  });

  return Array.from(dailyDataMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || '30d'; // Default to 30 days

  let days = 30;
  if (range === '90d') {
    days = 90;
  } else if (range === '7d') {
    days = 7;
  }

  try {
    const data = await getDailyData(days, organization.id);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API/DASHBOARD/ACTIVITY_STATS] Error:", error);
    return NextResponse.json({ message: "Failed to fetch activity data" }, { status: 500 });
  }
} 