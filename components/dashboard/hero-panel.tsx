"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { quickActions } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";

interface HeroPanelProps {
  className?: string;
}

export function HeroPanel({ className }: HeroPanelProps) {
  return (
    <Card className={cn(
      "border-border/40 bg-card/40 backdrop-blur-md overflow-hidden relative",
      "p-6 w-full",
      className
    )}>
      <div className="grid gap-6 md:grid-cols-2 items-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            Mission Ready:
            <span className="block text-[#4EA8DE]">Manage With Clarity</span>
          </h1>
          
          <p className="text-muted-foreground">
            Track members, collect dues, plan events — all in one mission panel.
          </p>
          
          <div className="flex flex-wrap gap-3 mt-6">
            {quickActions.map((action) => (
              <Button 
                key={action.title}
                variant="default" 
                className={cn(
                  "gap-2 transition-all duration-300",
                  action.color
                )}
              >
                <action.icon size={16} />
                {action.title}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="relative hidden md:block h-64">
          <div className="absolute inset-0 grid grid-cols-3 gap-4 opacity-90">
            <div className="space-y-4">
              <div className="h-16 rounded-md bg-primary/10 animate-pulse" style={{ animationDelay: "0s" }}></div>
              <div className="h-28 rounded-md bg-primary/5 animate-pulse" style={{ animationDelay: "0.1s" }}></div>
              <div className="h-12 rounded-md bg-primary/10 animate-pulse" style={{ animationDelay: "0.2s" }}></div>
            </div>
            <div className="space-y-4 mt-6">
              <div className="h-24 rounded-md bg-primary/5 animate-pulse" style={{ animationDelay: "0.3s" }}></div>
              <div className="h-16 rounded-md bg-primary/10 animate-pulse" style={{ animationDelay: "0.4s" }}></div>
              <div className="h-16 rounded-md bg-primary/5 animate-pulse" style={{ animationDelay: "0.5s" }}></div>
            </div>
            <div className="space-y-4 mt-12">
              <div className="h-20 rounded-md bg-primary/10 animate-pulse" style={{ animationDelay: "0.6s" }}></div>
              <div className="h-12 rounded-md bg-primary/5 animate-pulse" style={{ animationDelay: "0.7s" }}></div>
              <div className="h-24 rounded-md bg-primary/10 animate-pulse" style={{ animationDelay: "0.8s" }}></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Background glow effect */}
      <div 
        className="absolute -top-10 -left-10 w-40 h-40 rounded-full opacity-10 blur-3xl bg-[#4EA8DE]" 
      />
      <div 
        className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full opacity-10 blur-3xl bg-[#FFC46B]" 
      />
    </Card>
  );
}