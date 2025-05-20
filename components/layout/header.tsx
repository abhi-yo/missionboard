"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Menu, Search, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface HeaderProps {
  setIsMobileDrawerOpen: (isOpen: boolean) => void;
  isMobile: boolean;
}

export function Header({ setIsMobileDrawerOpen, isMobile }: HeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [showSearch, setShowSearch] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const handleNavigateToProfile = () => {
    router.push("/settings");
    setIsProfileOpen(false);
  };
  
  const handleNavigateToSettings = () => {
    router.push("/settings");
    setIsProfileOpen(false);
  };
  
  const handleNavigateToHelp = () => {
    // Navigate to help page or open help modal
    setIsProfileOpen(false);
  };
  
  const handleLogout = () => {
    signOut({ callbackUrl: '/auth/signin' });
  };
  
  // Get user initials for avatar fallback
  const getInitials = () => {
    if (!session?.user?.name) return "U";
    return session.user.name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };
  
  return (
    <header className={cn(
      "h-16 border-b border-border/40 px-4 fixed top-0 right-0 z-20",
      "bg-background/80 backdrop-blur-md",
      "flex items-center justify-between",
      "transition-all duration-300",
      isMobile ? "w-full" : "left-[70px]" // Adjust left offset based on sidebar for desktop
    )}>
      <div className="flex items-center">
        {isMobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2 md:hidden" // Show only on mobile
            onClick={() => setIsMobileDrawerOpen(true)}
          >
            <Menu size={20} />
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className={cn(
          "relative",
          showSearch ? "w-[300px]" : "w-auto"
        )}>
          {showSearch ? (
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input 
                className="pl-9 pr-9 h-9 w-full bg-muted/60" 
                placeholder="Search members, events..." 
                autoFocus
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 absolute right-0 top-0"
                onClick={() => setShowSearch(false)}
              >
                <X size={16} />
              </Button>
            </div>
          ) : (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9"
              onClick={() => setShowSearch(true)}
            >
              <Search size={18} />
            </Button>
          )}
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#FFC46B] rounded-full" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="p-3 border-b border-border/40">
              <h3 className="font-semibold">Notifications</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <div className="py-2 px-3 hover:bg-accent/50 cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center mt-1">
                    <Bell size={14} className="text-[#4EA8DE]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">New member joined</p>
                    <p className="text-xs text-muted-foreground">Taylor Reed has joined your organization</p>
                    <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
                  </div>
                </div>
              </div>
              <div className="py-2 px-3 hover:bg-accent/50 cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center mt-1">
                    <Bell size={14} className="text-[#FFC46B]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Payment received</p>
                    <p className="text-xs text-muted-foreground">Jamie Chen has paid their annual dues</p>
                    <p className="text-xs text-muted-foreground mt-1">5 hours ago</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-2 border-t border-border/40 text-center">
              <Button variant="ghost" size="sm" className="text-xs w-full">
                View all notifications
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Popover open={isProfileOpen} onOpenChange={setIsProfileOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session?.user?.image || ""} />
                <AvatarFallback className="text-xs">{getInitials()}</AvatarFallback>
              </Avatar>
              <span className="hidden md:inline font-medium">{session?.user?.name || "User"}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-0" align="end" side="bottom">
            <div className="py-2">
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent/50 transition-colors"
                onClick={handleNavigateToProfile}
              >
                Profile
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent/50 transition-colors"
                onClick={handleNavigateToSettings}
              >
                Settings
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent/50 transition-colors"
                onClick={handleNavigateToHelp}
              >
                Help
              </button>
              <div className="my-1 border-t border-border/40"></div>
              <button
                className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-accent/50 transition-colors"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}