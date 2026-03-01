import { isValidPath } from '@web/lib/utils';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Gets the original path from the URL search params. The `redirect` parameter is set by the middleware.
 * If the user tries to access some protected path  (e.g., `/protected`) and is not logged in,
 * the middleware redirects them to `/auth/login?redirect=/protected`
 */
export function useAuthVerificationUrl() {
  const [isMounted, setIsMounted] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return {
    get verificationUrl() {
      if (!isMounted) {
        return '';
      }

      const url = new URL(window.location.origin);
      url.pathname = '/auth/verify-session';

      // The previous pathname that the user was trying to access without being logged in
      const originalPath = searchParams.get('redirect');

      // Prevent redirecting outside the app
      const redirectPath = originalPath && isValidPath(originalPath) ? originalPath : '';

      if (redirectPath) {
        url.searchParams.set('redirect', redirectPath);
      }

      return url.toString();
    },
  };
}
