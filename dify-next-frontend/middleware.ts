import { NextRequest, NextResponse } from 'next/server';

// Define public paths that don't need authentication
const PUBLIC_PATHS = ['/', '/login', '/signup', '/forgot-password'];
// List of static file paths and API routes that should be skipped
const EXCLUDED_PATHS = ['/api', '/_next', '/images', '/favicon.ico'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for excluded paths
  if (EXCLUDED_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // Check if the path is public
  const isPublicPath = PUBLIC_PATHS.includes(pathname);
  
  // Get auth token and/or user from cookies
  const token = request.cookies.get('next-auth.session-token') || request.cookies.get('__Secure-next-auth.session-token');
  const user = request.cookies.get('user');
  
  const isAuthenticated = !!token || !!user;
  
  // If the route is protected and user is not authenticated, redirect to login
  if (!isPublicPath && !isAuthenticated) {
    const url = new URL(`/login`, request.url);
    url.searchParams.set('redirect', encodeURIComponent(pathname));
    
    return NextResponse.redirect(url);
  }
  
  // If user is authenticated and visiting a public path (like login),
  // redirect to the dashboard page
  if (isPublicPath && pathname !== '/' && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
