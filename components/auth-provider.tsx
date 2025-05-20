"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Log when the AuthProvider mounts
    console.log("[DEBUG] AuthProvider mounted");
    
    // Check for existing session cookie
    const cookies = document.cookie.split(';').map(c => c.trim());
    const sessionCookie = cookies.find(c => 
      c.startsWith('next-auth.session-token=') || 
      c.startsWith('__Secure-next-auth.session-token=')
    );
    console.log("[DEBUG] Found session cookie:", sessionCookie ? "Yes" : "No");
  }, []);

  return (
    <SessionProvider 
      // Force secure to false for localhost testing on Windows
      // since localhost is treated as secure in newer browsers
      // but NextAuth might have issues with this on Windows
      refetchInterval={5} // Check session validity every 5 seconds (for debugging)
    >
      {children}
    </SessionProvider>
  );
} 