'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingSpinner } from '@web/components/ui/loading-spinner';
import { createClient } from '@web/lib/supabase/client';
import { isValidPath } from '@web/lib/utils';

/**
 * This page is used as a redirect URL after the user clicks on the magic link or completes the OAuth flow.
 * Its sole purpose is to verify the supabase session and allow Supabase to set the session cookies.
 * After it mounts, it redirects the user to the home page or the original path they intended to visit.
 *
 * User authentication & authorization are not handled here. If the user is trying to access a protected route,
 * the concerned authorizer component of that route will handle that.
 */
export default function VerifySessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const originalPath = searchParams.get('redirect') ?? '/';

  useEffect(() => {
    async function redirect() {
      const supabase = createClient();
      await supabase.auth.getSession();
      // Prevent redirecting outside the app
      router.replace(isValidPath(originalPath) ? originalPath : '/');
    }
    redirect();
  }, [originalPath, router]);

  // TODO: Use translations for the label
  return <LoadingSpinner fullPage label={'Verifying session...'} />;
}
