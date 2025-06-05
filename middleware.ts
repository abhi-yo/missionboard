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
    "http://localhost:3000",
  ];
  
  const origin = req.headers.get("origin");
  
  // Only set CORS headers if it's an API request and the origin is allowed
  if (req.nextUrl.pathname.startsWith("/api/") && origin && allowedOrigins.includes(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    
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
  
  // For API routes, we handle CORS but not authentication
  if (isApiRequest) {
    const response = NextResponse.next();
    return handleCORS(request, response);
  }
  
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