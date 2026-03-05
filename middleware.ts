import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Note: Firebase Auth cannot be verified in Edge middleware
// Route protection is handled client-side in the components
// This middleware is kept minimal for future API route protection

export function middleware(request: NextRequest) {
  // For now, just pass through all requests
  // Route protection is handled on the client side
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

