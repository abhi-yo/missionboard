import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { MemberRole } from "@/lib/generated/prisma";

// All routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/users",
  "/plans",
  "/subscriptions",
  "/events",
  "/payments",
  "/analytics",
  "/settings",
];

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  
  // If user is not logged in, redirect to login
  if (!token) {
    const url = new URL('/auth/signin', request.url);
    url.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  
  // All authenticated users have full access to all routes
  // No need to check roles or redirect to different dashboards
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protect all dashboard routes
    "/dashboard/:path*",
    "/users/:path*",
    "/plans/:path*", 
    "/subscriptions/:path*", 
    "/events/:path*", 
    "/payments/:path*", 
    "/analytics/:path*", 
    "/settings/:path*",
    // Also protect the root paths
    "/users",
    "/plans",
    "/subscriptions",
    "/events",
    "/payments",
    "/analytics",
    "/settings",
  ],
}; 