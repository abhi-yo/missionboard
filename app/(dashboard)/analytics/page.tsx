"use client";

import { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

// Type definitions for the analytics data
interface MembershipDataPoint {
  name: string;
  members: number;
}

interface RevenueDataPoint {
  name: string;
  amount: number;
}

interface EventAttendanceDataPoint {
  name: string;
  attended: number;
  capacity: number;
}

interface MembershipStatusDataPoint {
  name: string;
  value: number;
  color: string;
}

interface AnalyticsData {
  membershipData: MembershipDataPoint[];
  revenueData: RevenueDataPoint[];
  eventAttendanceData: EventAttendanceDataPoint[];
  membershipStatusData: MembershipStatusDataPoint[];
}

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState("last6months");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch analytics data
  useEffect(() => {
    async function fetchAnalyticsData() {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/analytics?timeframe=${timeframe}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch analytics data: ${response.statusText}`);
        }
        
        const data = await response.json();
        setAnalyticsData(data);
      } catch (err: any) {
        console.error("Error fetching analytics data:", err);
        setError(err.message);
        toast.error("Failed to load analytics data", { description: err.message });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchAnalyticsData();
  }, [timeframe]);
  
  const handleTimeframeChange = (value: string) => {
    setTimeframe(value);
  };
  
  return (
    <PageContainer>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        
        <Select value={timeframe} onValueChange={handleTimeframeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last30days">Last 30 days</SelectItem>
            <SelectItem value="last3months">Last 3 months</SelectItem>
            <SelectItem value="last6months">Last 6 months</SelectItem>
            <SelectItem value="lastyear">Last year</SelectItem>
            <SelectItem value="alltime">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Tabs defaultValue="overview" className="mb-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Membership</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-border/40 bg-card/40 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Membership Growth</CardTitle>
                <CardDescription>Total members over time</CardDescription>
              </CardHeader>
              <CardContent className="p-2">
                <div className="h-[300px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center w-full h-full">
                      <Skeleton className="w-full h-full" />
                    </div>
                  ) : error ? (
                    <div className="flex items-center justify-center w-full h-full text-destructive">
                      Failed to load data
                    </div>
                  ) : analyticsData?.membershipData && analyticsData.membershipData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analyticsData.membershipData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#121317', 
                            borderColor: 'rgba(255,255,255,0.1)',
                            borderRadius: '0.5rem'
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="members" 
                          name="Members"
                          stroke="hsl(var(--chart-1))" 
                          fill="hsl(var(--chart-1))" 
                          fillOpacity={0.2} 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                      No membership data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-border/40 bg-card/40 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Revenue</CardTitle>
                <CardDescription>Monthly revenue collected</CardDescription>
              </CardHeader>
              <CardContent className="p-2">
                <div className="h-[300px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center w-full h-full">
                      <Skeleton className="w-full h-full" />
                    </div>
                  ) : error ? (
                    <div className="flex items-center justify-center w-full h-full text-destructive">
                      Failed to load data
                    </div>
                  ) : analyticsData?.revenueData && analyticsData.revenueData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.revenueData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#121317', 
                            borderColor: 'rgba(255,255,255,0.1)',
                            borderRadius: '0.5rem'
                          }}
                          formatter={(value) => [`$${value}`, 'Amount']}
                        />
                        <Bar 
                          dataKey="amount" 
                          name="Revenue" 
                          fill="hsl(var(--chart-2))" 
                          radius={[4, 4, 0, 0]} 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                      No revenue data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-border/40 bg-card/40 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Event Attendance</CardTitle>
                <CardDescription>Attendance vs. capacity for events</CardDescription>
              </CardHeader>
              <CardContent className="p-2">
                <div className="h-[300px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center w-full h-full">
                      <Skeleton className="w-full h-full" />
                    </div>
                  ) : error ? (
                    <div className="flex items-center justify-center w-full h-full text-destructive">
                      Failed to load data
                    </div>
                  ) : analyticsData?.eventAttendanceData && analyticsData.eventAttendanceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.eventAttendanceData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#121317', 
                            borderColor: 'rgba(255,255,255,0.1)',
                            borderRadius: '0.5rem'
                          }}
                        />
                        <Legend />
                        <Bar dataKey="attended" name="Attended" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="capacity" name="Capacity" fill="hsl(var(--chart-4))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                      No event attendance data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-border/40 bg-card/40 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Membership Status</CardTitle>
                <CardDescription>Distribution by current status</CardDescription>
              </CardHeader>
              <CardContent className="p-2">
                <div className="h-[300px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center w-full h-full">
                      <Skeleton className="w-full h-full" />
                    </div>
                  ) : error ? (
                    <div className="flex items-center justify-center w-full h-full text-destructive">
                      Failed to load data
                    </div>
                  ) : analyticsData?.membershipStatusData && analyticsData.membershipStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsData.membershipStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="name"
                          label={(entry) => entry.name}
                          labelLine={false}
                        >
                          {analyticsData.membershipStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#121317', 
                            borderColor: 'rgba(255,255,255,0.1)',
                            borderRadius: '0.5rem'
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                      No membership status data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="members" className="mt-6">
          <Card className="border-border/40 bg-card/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle>Membership Analytics</CardTitle>
              <CardDescription>Detailed membership growth and statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {isLoading ? (
                  <div className="flex items-center justify-center w-full h-full">
                    <Skeleton className="w-full h-full" />
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center w-full h-full text-destructive">
                    Failed to load data
                  </div>
                ) : analyticsData?.membershipData && analyticsData.membershipData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analyticsData.membershipData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#121317', 
                          borderColor: 'rgba(255,255,255,0.1)',
                          borderRadius: '0.5rem'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="members" 
                        name="Total Members"
                        stroke="hsl(var(--chart-1))" 
                        fill="hsl(var(--chart-1))" 
                        fillOpacity={0.2} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                    No membership data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="revenue" className="mt-6">
          <Card className="border-border/40 bg-card/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>Detailed revenue statistics and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {isLoading ? (
                  <div className="flex items-center justify-center w-full h-full">
                    <Skeleton className="w-full h-full" />
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center w-full h-full text-destructive">
                    Failed to load data
                  </div>
                ) : analyticsData?.revenueData && analyticsData.revenueData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.revenueData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#121317', 
                          borderColor: 'rgba(255,255,255,0.1)',
                          borderRadius: '0.5rem'
                        }}
                        formatter={(value) => [`$${value}`, 'Amount']}
                      />
                      <Legend />
                      <Bar 
                        dataKey="amount" 
                        name="Monthly Revenue" 
                        fill="hsl(var(--chart-2))" 
                        radius={[4, 4, 0, 0]} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                    No revenue data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="events" className="mt-6">
          <Card className="border-border/40 bg-card/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle>Event Analytics</CardTitle>
              <CardDescription>Event attendance and engagement statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {isLoading ? (
                  <div className="flex items-center justify-center w-full h-full">
                    <Skeleton className="w-full h-full" />
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center w-full h-full text-destructive">
                    Failed to load data
                  </div>
                ) : analyticsData?.eventAttendanceData && analyticsData.eventAttendanceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.eventAttendanceData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={150} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#121317', 
                          borderColor: 'rgba(255,255,255,0.1)',
                          borderRadius: '0.5rem'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="attended" name="Attendance" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="capacity" name="Capacity" fill="hsl(var(--chart-4))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                    No event data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}