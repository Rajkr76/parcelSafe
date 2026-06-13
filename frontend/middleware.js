import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const publicRoutes = ['/auth/signin', '/api/auth'];

export default async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/firebase-messaging-sw.js') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.ico')
  ) {
    return NextResponse.next();
  }

  // Use getToken (edge-compatible) instead of auth() wrapper
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });

  // Redirect unauthenticated users to sign in
  if (!token) {
    const signInUrl = new URL('/auth/signin', req.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Allow authenticated users to access root and onboarding
  if (pathname === '/' || pathname.startsWith('/onboarding')) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
