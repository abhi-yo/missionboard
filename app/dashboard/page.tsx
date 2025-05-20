"use client";

import { useSession } from "next-auth/react";
import { PageContainer } from "@/components/layout/page-container";
import { HeroPanel } from "@/components/dashboard/hero-panel";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { UserList } from "@/components/dashboard/user-list";
import { EventCard } from "@/components/dashboard/event-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, User, Calendar, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MemberRole } from "@/lib/generated/prisma";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    upcomingEvents: 0,
    totalRevenue: 0
  });
  const [activities, setActivities] = useState([]);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // No role check - all users should access the dashboard now
  
  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // You would fetch real data from your API here
        // For now, we'll just simulate loading
        setTimeout(() => {
          setStats({
            totalUsers: 1,
            activeSubscriptions: 2,
            upcomingEvents: 0,
            totalRevenue: 198
          });
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  return (
    <PageContainer>
      <HeroPanel className="mb-6" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-border/40 bg-card/40 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">All registered users</p>
          </CardContent>
        </Card>
        
        <Card className="border-border/40 bg-card/40 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">Current paid memberships</p>
          </CardContent>
        </Card>
        
        <Card className="border-border/40 bg-card/40 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingEvents}</div>
            <p className="text-xs text-muted-foreground">Scheduled events this month</p>
          </CardContent>
        </Card>
        
        <Card className="border-border/40 bg-card/40 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue}</div>
            <p className="text-xs text-muted-foreground">From all subscriptions</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-border/40 bg-card/40 backdrop-blur-md md:col-span-2">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="flex items-center justify-center gap-2 h-24 flex-col"
                onClick={() => router.push('/users/new')}
              >
                <User className="h-6 w-6" />
                <span>Add User</span>
              </Button>
              
              <Button 
                variant="outline"
                className="flex items-center justify-center gap-2 h-24 flex-col"
                onClick={() => router.push('/plans/new')}
              >
                <CreditCard className="h-6 w-6" />
                <span>Create Plan</span>
              </Button>
              
              <Button 
                variant="outline"
                className="flex items-center justify-center gap-2 h-24 flex-col"
                onClick={() => router.push('/events/new')}
              >
                <Calendar className="h-6 w-6" />
                <span>Schedule Event</span>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/40 bg-card/40 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle>Activity Feed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.length > 0 ? (
                <div className="space-y-4">
                  {/* Activities would be listed here */}
                </div>
              ) : (
                <div className="text-center p-4">
                  <p className="text-muted-foreground">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Users</h2>
          <Button 
            variant="link" 
            className="text-[#4EA8DE]"
            onClick={() => router.push('/users')}
          >
            View All
          </Button>
        </div>
        
        <UserList limit={5} />
      </div>
    </PageContainer>
  );
} 