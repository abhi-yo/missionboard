"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Users, CalendarDays, CreditCard, BarChart } from "lucide-react";
import { StatItem } from "@/types";
import React from "react";

// Define the icon map
const iconMap: { [key: string]: React.ElementType } = {
  users: Users,
  calendar: CalendarDays,
  credit: CreditCard,
  trending: BarChart,
};

interface StatsCardProps {
  stat: StatItem;
  className?: string;
}

export function StatsCard({ stat, className }: StatsCardProps) {
  const { title, value, change, trend, iconName } = stat;
  
  const IconComponent = iconMap[iconName];
  
  return (
    <Card className={cn(
      "p-5 border-border/40 bg-card/40 backdrop-blur-md",
      "hover:border-primary/20 hover:bg-card/60 transition-all duration-300",
      "overflow-hidden relative group",
      className
    )}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {title}
          </p>
          <h3 className="text-2xl font-bold">{value}</h3>
          
          <div className="flex items-center mt-2">
            {trend === "up" ? (
              <TrendingUp size={14} className="text-emerald-500 mr-1" />
            ) : (
              <TrendingDown size={14} className="text-rose-500 mr-1" />
            )}
            
            <span className={cn(
              "text-xs font-medium",
              trend === "up" ? "text-emerald-500" : "text-rose-500"
            )}>
              {change > 0 ? "+" : ""}{change}%
            </span>
            
            <span className="text-xs text-muted-foreground ml-1">
              vs. last month
            </span>
          </div>
        </div>
        
        <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
          {IconComponent ? <IconComponent size={18} className="text-[#AD49E1]" /> : null}
        </div>
      </div>
      
      {/* Background glow effect */}
      <div 
        className={cn(
          "absolute -bottom-8 -right-8 w-24 h-24 rounded-full",
          "opacity-0 group-hover:opacity-20 transition-opacity duration-500",
          "blur-xl bg-[#AD49E1]"
        )} 
      />
    </Card>
  );
}