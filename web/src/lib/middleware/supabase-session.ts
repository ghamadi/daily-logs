import { createServerClient } from '@supabase/ssr';
import { ProxyResult } from '@web/proxy';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest): Promise<ProxyResult> {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const requestPathname = request.nextUrl.pathname;
  const isPublicRoute = requestPathname.startsWith('/auth/');
  const isLoginPage = requestPathname.startsWith('/auth/login');
  const nextUrl = request.nextUrl.clone();

  // If the user is not authenticated and requesting a non-public page, redirect to the login page.
  if (!user && !isPublicRoute) {
    nextUrl.pathname = '/auth/login';
    if (requestPathname !== '/') {
      nextUrl.searchParams.set('redirect', requestPathname + request.nextUrl.search);
    }
    return { redirectResponse: NextResponse.redirect(nextUrl) };
  }

  // If the user is authenticated and requesting the login page, redirect to the home page.
  if (user && isLoginPage) {
    nextUrl.pathname = '/';
    return { redirectResponse: NextResponse.redirect(nextUrl) };
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return { nextResponse: supabaseResponse };
}
