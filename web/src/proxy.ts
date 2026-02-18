import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@web/lib/middleware/supabase-session';

export type ProxyResult =
  | { redirectResponse: NextResponse; nextResponse?: undefined }
  | { redirectResponse?: undefined; nextResponse: NextResponse };

/**
 * All functions called within this proxy must return a ProxyResult.
 * The proxy controls the sequence in which the internal functions are called,
 * and based on the ProxyResult decides whether to redirect or continue to the next middleware.
 *
 * * NOTE *
 * The proxy intercepts requests to the app's pages only. API routes will NOT trigger this proxy.
 * Since the proxy runs in Edge runtime, it can neither access the database nor use nodejs modules like crypto.
 * Therefore, authorization of the API routes will need to trigger a dedicated API (e.g., `/api/auth/verify`),
 * which negates the benefit of using the proxy. Access control for API routes is handled by the API route itself.
 */
export async function proxy(request: NextRequest) {
  const { redirectResponse, nextResponse } = await updateSession(request);
  return redirectResponse ?? nextResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
