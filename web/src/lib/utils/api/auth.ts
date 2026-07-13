import 'server-only';

import { cookies } from 'next/headers';

import { getDb } from '@infrastructure/db/get-db';
import { DrizzleUsersRepository } from '@infrastructure/repositories/users/drizzle-users-repository';
import { createServerClient } from '@/lib/supabase/server';
import { ApiErrors } from '@/lib/errors';
import {
  E2E_SESSION_COOKIE_NAME,
  isE2eAuthBypassEnabled,
  parseE2eSessionCookieValue,
} from '@/lib/testing/e2e-auth';
import { AuthProvider, User } from '@daily-logs/domains/users';

/**
 * Resolve the current authenticated Supabase user into a domain principal.
 * This utility is intended for server components and Node.js route handlers,
 * not Edge runtime code such as proxy/middleware or edge route handlers.
 */
export async function getAuthenticatedPrincipal(): Promise<User> {
  // E2E bypass: resolve the principal from the injected test cookie instead of
  // verifying a Supabase JWT. Crucially, resolution still flows through the same
  // getOrCreateUser path as production — so with the seeded auth identity this
  // returns the seeded user rather than creating a new one. Only reached under
  // E2E_AUTH_BYPASS=1 in a non-production build; see @/lib/testing/e2e-auth.
  if (isE2eAuthBypassEnabled()) {
    const cookieValue = (await cookies()).get(E2E_SESSION_COOKIE_NAME)?.value;
    const session = parseE2eSessionCookieValue(cookieValue);

    if (!session) {
      throw new ApiErrors.UnauthorizedError('Could not authenticate user.');
    }

    // No email_confirmed_at check: the test session is confirmed by construction.
    const usersRepository = new DrizzleUsersRepository(getDb());
    return await usersRepository.getOrCreateUser({
      email: session.email,
      provider: AuthProvider.Supabase,
      providerUserId: session.sub,
    });
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new ApiErrors.UnauthorizedError('Could not authenticate user.');
  }

  const { email, email_confirmed_at, id: supabaseUserId } = data.user;
  if (!email) {
    throw new ApiErrors.UnauthorizedError('Could not authenticate user. No email found.');
  }

  if (!email_confirmed_at) {
    throw new ApiErrors.UnauthorizedError('Could not authenticate user. Email is not verified.');
  }

  const usersRepository = new DrizzleUsersRepository(getDb());

  return await usersRepository.getOrCreateUser({
    email,
    provider: AuthProvider.Supabase,
    providerUserId: supabaseUserId,
  });
}
