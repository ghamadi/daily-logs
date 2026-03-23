import { AuthProvider } from '@domains/users/value-objects/auth-provider';
import { getDb } from '@infrastructure/db/get-db';
import { DrizzleUsersRepository } from '@infrastructure/repositories/users/drizzle-users-repository';
import { createServerClient } from '@web/lib/supabase/server';
import { ApiErrors } from '@web/lib/errors/api-errors';
import { User } from '@domains/users/entities/user';

/**
 * Resolve the current authenticated Supabase user into a domain principal.
 * This utility is intended for server components and Node.js route handlers, not middleware/proxy code.
 */
export async function getAuthenticatedPrincipal(): Promise<User> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new ApiErrors.Unauthorized('Could not authenticate user.');
  }

  const { id, email } = data.user;
  if (!email) {
    throw new ApiErrors.Unauthorized('Could not authenticate user. No email found.');
  }

  const linkedUser = await ensureLinkedUser({
    email,
    supabaseUid: id,
  });

  return linkedUser;
}

async function ensureLinkedUser(params: { email: string; supabaseUid: string }) {
  const { email, supabaseUid } = params;

  const { db } = getDb();
  const usersRepository = new DrizzleUsersRepository(db);

  const linkedUser = await usersRepository.findByAuthIdentity({
    provider: AuthProvider.Supabase,
    providerUserId: supabaseUid,
  });

  if (linkedUser?.isDeactivated) {
    throw new ApiErrors.Forbidden('User account is deactivated.');
  }

  if (linkedUser) {
    return linkedUser;
  }

  const user = await usersRepository.findByEmail(email);

  if (!user) {
    throw new ApiErrors.Unauthorized('Could not authenticate user.');
  }

  await usersRepository.linkAuthIdentity({
    userId: user.id,
    provider: AuthProvider.Supabase,
    providerUserId: supabaseUid,
  });

  return user;
}
