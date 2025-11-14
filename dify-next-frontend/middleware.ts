import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define public paths that don't need authentication
const PUBLIC_PATHS = ['/', '/login', '/signup', '/forgot-password', '/logout'];
// List of static file paths and API routes that should be skipped
const EXCLUDED_PATHS = ['/api', '/_next', '/images', '/favicon.ico'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for excluded paths
  if (EXCLUDED_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // Check if the path is public
  const isPublicPath = PUBLIC_PATHS.includes(pathname);
  
  // Get auth token from NextAuth
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });
  
  const isAuthenticated = !!token;
  
  // === 新增：管理員權限檢查 ===
  // 如果用戶已登入但不是管理員，重定向到 Wiki.js
  if (isAuthenticated && token?.role !== 'admin' && !isPublicPath && pathname !== '/logout') {
    const wikiUrl = process.env.NEXT_PUBLIC_WIKI_URL || 'http://localhost:3002';
    console.log(`Non-admin user ${token?.email} redirected to Wiki.js`);
    return NextResponse.redirect(wikiUrl);
  }
  
  // If the route is protected and user is not authenticated, redirect to login
  // But skip redirect for logout process to avoid redirect loops
  if (!isPublicPath && !isAuthenticated) {
    // 檢查是否是登出過程相關的請求
    if (pathname === '/logout' || 
        request.headers.get('referer')?.includes('/logout') ||
        request.headers.get('referer')?.includes('signout')) {
      return NextResponse.next();
    }
    
    const url = new URL(`/login`, request.url);
    url.searchParams.set('redirect', encodeURIComponent(pathname));
    
    return NextResponse.redirect(url);
  }
  
  // If user is authenticated and visiting a public path (like login),
  // redirect to the dashboard page, but skip this during logout process
  if (isPublicPath && pathname !== '/' && pathname !== '/logout' && isAuthenticated) {
    // 檢查是否是登出過程中的請求
    const referer = request.headers.get('referer');
    if (referer && referer.includes('/logout')) {
      return NextResponse.next();
    }
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
