import { getDb } from '@infrastructure/db/get-db';
import { DrizzleUsersRepository } from '@infrastructure/repositories/users/drizzle-users-repository';
import { createServerClient } from '@web/lib/supabase/server';
import { ApiErrors } from '@web/lib/errors/api-errors';
import { User } from '@domains/users/entities/user';
import { AuthProvider } from '@domains/users/value-objects/auth-provider';

/**
 * Resolve the current authenticated Supabase user into a domain principal.
 * This utility is intended for server components and Node.js route handlers,
 * not Edge runtime code such as proxy/middleware or edge route handlers.
 */
export async function getAuthenticatedPrincipal(): Promise<User> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new ApiErrors.Unauthorized('Could not authenticate user.');
  }

  const { email, email_confirmed_at, id: supabaseUserId } = data.user;
  if (!email) {
    throw new ApiErrors.Unauthorized('Could not authenticate user. No email found.');
  }

  if (!email_confirmed_at) {
    throw new ApiErrors.Unauthorized('Could not authenticate user. Email is not verified.');
  }

  const usersRepository = new DrizzleUsersRepository(getDb());

  const user = await usersRepository.findByEmail(email, {
    provider: AuthProvider.Supabase,
    providerUserId: supabaseUserId,
  });

  if (!user) {
    throw new ApiErrors.Unauthorized('Could not authenticate user. Invalid email or auth identity.');
  }

  return user;
}
