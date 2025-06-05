import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

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

// A custom CORS function to handle API requests
function handleCORS(req: NextRequest, res: NextResponse) {
  // Define allowed origins (add your Vercel deployment URL and localhost)
  const allowedOrigins = [
    "https://missionboard-one.vercel.app",
    "https://missionboard-one-vercel.app",
    "https://missionboard.vercel.app",
    "http://localhost:3000",
  ];
  
  const origin = req.headers.get("origin") || "";
  
  // For API requests, set CORS headers
  if (req.nextUrl.pathname.startsWith("/api/")) {
    // If it's a preflight request or from an allowed origin
    const isAllowedOrigin = allowedOrigins.includes(origin);
    
    // Set CORS headers
    res.headers.set("Access-Control-Allow-Origin", isAllowedOrigin ? origin : "*");
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-CSRF-Token");
    
    // For preflight requests (OPTIONS)
    if (req.method === "OPTIONS") {
      return new NextResponse(null, { 
        status: 204,
        headers: res.headers
      });
    }
  }
  
  return res;
}

export async function middleware(request: NextRequest) {
  // Check if the path is for API
  const isApiRequest = request.nextUrl.pathname.startsWith('/api/');
  
  // For API routes
  if (isApiRequest) {
    // Handle preflight requests first
    if (request.method === "OPTIONS") {
      const response = new NextResponse(null, { status: 204 });
      return handleCORS(request, response);
    }
    
    // For regular API requests, apply CORS and continue
    const response = NextResponse.next();
    return handleCORS(request, response);
  }
  
  // For non-API routes, check authentication
  const token = await getToken({ req: request });
  
  // For protected routes, ensure user is logged in
  if (!token) {
    // Check if the requested path is a protected route
    const isProtectedRoute = protectedRoutes.some(route => 
      request.nextUrl.pathname === route || 
      request.nextUrl.pathname.startsWith(`${route}/`)
    );
    
    if (isProtectedRoute) {
      const url = new URL('/auth/signin', request.url);
      url.searchParams.set('callbackUrl', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }
  
  // Return the response
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
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