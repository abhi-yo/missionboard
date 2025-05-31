"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    
    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar 
        isMobile={isMobile} 
        isMobileOpen={isMobileOpen} 
        setIsMobileOpen={setIsMobileOpen}
      />
      
      <div className={`flex-1 transition-all duration-300 ${!isMobile ? "lg:pl-20" : ""}`}>
        <Header isMobile={isMobile} setIsMobileDrawerOpen={setIsMobileOpen} />
        
        <main className="p-5 pt-20">
          {children}
        </main>
      </div>
    </div>
  );
} 