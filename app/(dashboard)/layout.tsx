"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar 
        isMobile={isMobile}
        isMobileOpen={isMobileDrawerOpen}
        setIsMobileOpen={setIsMobileDrawerOpen}
      />
      
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300 relative",
        isMobile ? "ml-0" : "ml-[70px]"
      )}>
        <Header setIsMobileDrawerOpen={setIsMobileDrawerOpen} isMobile={isMobile} />
        
        <main className="flex-1 pt-16">
          {/* Background pattern grid */}
          <div className="absolute inset-0 bg-grid-pattern bg-[radial-gradient(#AD49E1_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.03] pointer-events-none z-0" />
          
          {children}
        </main>
      </div>
    </div>
  );
}