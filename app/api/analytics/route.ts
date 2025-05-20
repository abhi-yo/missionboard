import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';

export const dynamic = 'force-dynamic';

// GET - Fetch analytics data
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const timeframe = url.searchParams.get('timeframe') || 'last6months';
    
    // Calculate date range based on timeframe
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case 'last30days':
        startDate = subMonths(now, 1);
        break;
      case 'last3months':
        startDate = subMonths(now, 3);
        break;
      case 'last6months':
        startDate = subMonths(now, 6);
        break;
      case 'lastyear':
        startDate = subMonths(now, 12);
        break;
      default:
        startDate = subMonths(now, 6); // Default to 6 months
    }

    // Get membership growth data
    const monthlyUsers = await fetchMonthlyUsers(startDate, now);
    
    // Get revenue data
    const monthlyRevenue = await fetchMonthlyRevenue(startDate, now);
    
    // Get membership status data
    const statusDistribution = await fetchMembershipStatus();
    
    // Get event attendance data
    const eventAttendance = await fetchEventAttendance();

    return NextResponse.json({
      membershipData: monthlyUsers,
      revenueData: monthlyRevenue,
      membershipStatusData: statusDistribution,
      eventAttendanceData: eventAttendance
    });
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    return NextResponse.json({ message: "Failed to fetch analytics data" }, { status: 500 });
  }
}

async function fetchMonthlyUsers(startDate: Date, endDate: Date) {
  // Get all users within the date range
  const users = await prisma.user.findMany({
    where: {
      joinDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      joinDate: true,
    },
  });

  // Group users by month
  const monthlyData: Record<string, number> = {};
  
  // Initialize months
  let currentDate = startOfMonth(startDate);
  while (currentDate <= endDate) {
    const monthKey = format(currentDate, 'MMM');
    monthlyData[monthKey] = 0;
    currentDate = startOfMonth(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  }

  // Count users per month (cumulative)
  let total = 0;
  for (const monthKey of Object.keys(monthlyData)) {
    const monthUsers = users.filter(user => 
      user.joinDate && format(new Date(user.joinDate), 'MMM') === monthKey
    ).length;
    
    total += monthUsers;
    monthlyData[monthKey] = total;
  }

  // Format the data for chart
  return Object.entries(monthlyData).map(([name, members]) => ({
    name,
    members
  }));
}

async function fetchMonthlyRevenue(startDate: Date, endDate: Date) {
  // Get all payments within the date range
  const payments = await prisma.payment.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      status: 'COMPLETED',
    },
    select: {
      amount: true,
      createdAt: true,
    },
  });

  // Group payments by month
  const monthlyData: Record<string, number> = {};
  
  // Initialize months
  let currentDate = startOfMonth(startDate);
  while (currentDate <= endDate) {
    const monthKey = format(currentDate, 'MMM');
    monthlyData[monthKey] = 0;
    currentDate = startOfMonth(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  }

  // Sum payments per month
  for (const payment of payments) {
    const month = format(new Date(payment.createdAt), 'MMM');
    if (monthlyData[month] !== undefined) {
      monthlyData[month] += Number(payment.amount);
    }
  }

  // Format the data for chart
  return Object.entries(monthlyData).map(([name, amount]) => ({
    name,
    amount
  }));
}

async function fetchMembershipStatus() {
  // Get counts of users by status
  const statusCounts = await prisma.user.groupBy({
    by: ['status'],
    _count: {
      id: true
    }
  });
  
  // Define colors for each status
  const statusColors = {
    active: "#4EA8DE",
    pending: "#22C55E",
    inactive: "#9CA3AF",
    cancelled: "#FFC46B"
  };
  
  // Format the data for chart
  return statusCounts.map(status => ({
    name: status.status.charAt(0).toUpperCase() + status.status.slice(1),
    value: status._count.id,
    color: statusColors[status.status as keyof typeof statusColors] || "#9CA3AF"
  }));
}

async function fetchEventAttendance() {
  // Get all events with their registrations
  const events = await prisma.event.findMany({
    where: {
      date: {
        lte: new Date()
      },
      status: {
        in: ['COMPLETED', 'SCHEDULED']
      }
    },
    select: {
      name: true,
      capacity: true,
      registrations: {
        where: {
          status: 'CONFIRMED'
        },
        select: {
          id: true
        }
      }
    },
    take: 5
  });
  
  // Format the data for chart
  return events.map(event => ({
    name: event.name.length > 20 ? event.name.substring(0, 20) + '...' : event.name,
    attended: event.registrations.length,
    capacity: event.capacity || event.registrations.length
  }));
} 