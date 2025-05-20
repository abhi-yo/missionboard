'use client';

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { ActivityItem } from "@/types";
import { CreditCard, User, Calendar } from "lucide-react";

interface ActivityFeedProps {
  activities: ActivityItem[];
  className?: string;
}

export function ActivityFeed({ activities, className }: ActivityFeedProps) {
  const [activeTab, setActiveTab] = useState<string>("all");
  
  const filteredActivities = activeTab === "all" 
    ? activities 
    : activities.filter(activity => activity.type === activeTab);
  
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "member":
        return <User size={14} className="text-[#4EA8DE]" />;
      case "payment":
        return <CreditCard size={14} className="text-[#FFC46B]" />;
      case "event":
        return <Calendar size={14} className="text-emerald-500" />;
      default:
        return null;
    }
  };
  
  const getActionColor = (action: string) => {
    switch (action) {
      case "joined":
        return "text-emerald-500";
      case "completed":
        return "text-emerald-500";
      case "pending":
        return "text-amber-500";
      case "registered":
        return "text-blue-500";
      default:
        return "text-muted-foreground";
    }
  };
  
  return (
    <Card className={cn(
      "border-border/40 bg-card/40 backdrop-blur-md",
      "overflow-hidden",
      className
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
        <Tabs 
          defaultValue="all" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-4 h-8 w-full max-w-xs">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="member" className="text-xs">Members</TabsTrigger>
            <TabsTrigger value="event" className="text-xs">Events</TabsTrigger>
            <TabsTrigger value="payment" className="text-xs">Payments</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="px-2 py-1">
        <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2">
          {filteredActivities.map((activity) => (
            <div 
              key={activity.id}
              className="p-3 rounded-md hover:bg-accent/40 transition-colors"
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={activity.user.avatar} />
                  <AvatarFallback>{activity.user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{activity.user.name}</span>
                    <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center">
                      {getActivityIcon(activity.type)}
                    </div>
                    <span className={cn(
                      "text-xs font-medium",
                      getActionColor(activity.action)
                    )}>
                      {activity.action}
                    </span>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {activity.details}
                  </p>
                  
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}