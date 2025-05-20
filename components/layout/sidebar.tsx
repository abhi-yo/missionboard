"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { sidebarItems } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { LogOut, X } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { MemberRole } from "@/lib/generated/prisma";
import { LucideIcon } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";

interface SidebarProps {
  isMobile: boolean;
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
}

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export function Sidebar({ isMobile, isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isHovered, setIsHovered] = useState(false);
  
  // All authenticated users should always see admin sidebar
  const navItems = sidebarItems;

  const handleLogout = () => {
    signOut({ callbackUrl: '/auth/signin' });
  };

  const handleNavItemClick = () => {
    if (isMobile) {
      setIsMobileOpen(false);
    }
  };

  const shouldShowText = (isMobile && isMobileOpen) || (!isMobile && isHovered); 

  if (isMobile && !isMobileOpen) {
    return null; // Don't render anything if mobile and closed
  }

  return (
    <>
      {/* Overlay for mobile drawer */} 
      {isMobile && isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <div 
        className={cn(
          "h-screen fixed left-0 top-0 z-40 flex flex-col",
          "bg-background/80 backdrop-blur-md border-r border-border/40",
          "transition-all duration-300 ease-in-out",
          isMobile ? "w-[280px]" : (isHovered ? "w-[240px]" : "w-20")
        )}
        onMouseEnter={() => { if (!isMobile) setIsHovered(true); }}
        onMouseLeave={() => { if (!isMobile) setIsHovered(false); }}
      >
        <div className={cn(
          "flex items-center h-16 border-b border-border/40 px-4",
          shouldShowText ? "justify-between" : "justify-center"
        )}>
          <Link href="/dashboard" className="flex items-center gap-2" onClick={handleNavItemClick}>
            <Image 
              src="/appicon.png" 
              alt="MissionBoard Logo" 
              width={shouldShowText ? 30 : 36}
              height={shouldShowText ? 30 : 36} 
              className="rounded-md flex-shrink-0" 
            />
            {shouldShowText && (
              <span className="font-satoshi font-bold text-foreground whitespace-nowrap">
                MissionBoard
              </span>
            )}
          </Link>
          {isMobile && isMobileOpen && (
            <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(false)} className="md:hidden">
              <X size={20} />
            </Button>
          )}
        </div>

        <div className="flex flex-col flex-grow p-3 space-y-1 overflow-y-auto">
          {navItems.map((item: NavItem) => {
            const isActive = pathname === item.href || 
              (item.href !== "/" && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.title}
                onClick={handleNavItemClick}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-all",
                  "group hover:bg-accent/50",
                  shouldShowText ? "justify-start" : "justify-center",
                  
                  isActive 
                    ? "bg-accent/70 text-accent-foreground" 
                    : "text-muted-foreground"
                )}
              >
                <item.icon size={20} className={cn(
                  "min-w-5 transition-colors flex-shrink-0",
                  isActive ? "text-[#4EA8DE]" : "text-muted-foreground group-hover:text-foreground"
                )} />
                
                {shouldShowText && (
                  <span className={cn(
                    "font-medium transition-colors whitespace-nowrap",
                    isActive ? "text-foreground" : "group-hover:text-foreground"
                  )}>
                    {item.title}
                  </span>
                )}
                
                {/* Active indicator only for desktop expanded, or always on mobile if item is active */}
                {isActive && (
                   <div className={cn(
                     "absolute w-1 h-6 bg-[#4EA8DE] rounded-r-full left-0"
                     
                   )} />
                )}
              </Link>
            );
          })}
        </div>

        <div className="p-3 border-t border-border/40">
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              "w-full text-muted-foreground hover:text-foreground",
              shouldShowText ? "justify-start" : "justify-center"
              
            )}
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut size={18} className={cn("flex-shrink-0", shouldShowText ? "mr-2" : "")} />
            {shouldShowText && <span className="whitespace-nowrap">Logout</span>}
          </Button>
        </div>
      </div>
    </>
  );
}