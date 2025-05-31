"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// TODO: Replace with actual data fetching and dynamic types
interface ActivityDataPoint {
  date: string; // "YYYY-MM-DD"
  newUsers: number;
  revenue: number; // Or another metric like newSubscriptions
}

const chartConfig = {
  date: {
    label: "Date",
  },
  newUsers: {
    label: "New Users",
    color: "#9D43CC", // Purple to match the view all button
  },
  revenue: {
    label: "Revenue",
    color: "#4EA8DE", // Keep blue for contrast
  },
} satisfies ChartConfig;

export function ActivityChart() {
  const [timeRange, setTimeRange] = React.useState("30d"); // Default to 30 days
  const [chartData, setChartData] = React.useState<ActivityDataPoint[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchActivityData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/dashboard/activity-stats?range=${timeRange}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch activity data: ${response.statusText}`);
        }
        const data: ActivityDataPoint[] = await response.json();
        setChartData(data);
      } catch (error) {
        console.error("Failed to fetch activity data:", error);
        setChartData([]); // Clear data on error or set to an error state
        // You might want to show a toast notification here as well
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivityData();
  }, [timeRange]);

  return (
    <Card className="bg-card border border-border/60 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Activity Overview</CardTitle>
          <CardDescription>
            Showing new users and revenue for the selected period.
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="w-[160px] rounded-lg sm:ml-auto"
            aria-label="Select a time range"
          >
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="90d" className="rounded-lg">
              Last 90 days
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Last 30 days
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              Last 7 days
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Loading chart data...
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No activity data available for this period.
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="fillNewUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="#9D43CC"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="#9D43CC"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="#4EA8DE"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="#4EA8DE"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  vertical={true} 
                  horizontal={true} 
                  stroke="rgba(255,255,255,0.1)" 
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                  tickMargin={10}
                  minTickGap={32}
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                />
                <YAxis 
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                  tickMargin={10}
                  width={40}
                  tickFormatter={(value) => (value === 0 ? '0' : value)}
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: 'rgba(23, 23, 23, 0.95)', 
                    borderColor: 'rgba(255,255,255,0.2)',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    color: '#fff',
                  }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '5px' }}
                  formatter={(value, name) => {
                    if (name === 'revenue') {
                      return [`$${value}`, 'Revenue'];
                    }
                    return [value, 'New Users'];
                  }}
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      weekday: 'short',
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  animationDuration={300}
                />
                <Area
                  dataKey="newUsers"
                  type="monotone"
                  fill="url(#fillNewUsers)"
                  stroke="#9D43CC"
                  strokeWidth={2}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  animationDuration={1500}
                  animationEasing="ease-in-out"
                />
                <Area
                  dataKey="revenue"
                  type="monotone"
                  fill="url(#fillRevenue)"
                  stroke="#4EA8DE"
                  strokeWidth={2}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  animationDuration={1500}
                  animationEasing="ease-in-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 