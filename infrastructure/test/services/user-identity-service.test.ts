import { AccessDeniedError } from '@domains/shared/errors/access-denied-error';
import { UserIdentityService } from '@domains/users/services/user-identity-service';
import { AuthProvider } from '@domains/users/value-objects/auth-provider';
import { DrizzleUsersRepository } from '@infrastructure/repositories/users/drizzle-users-repository';

import { insertAuthIdentity, insertUser } from '../helpers/seed-data';
import { getTestDatabase } from '../helpers/test-database';
import { InvalidInputError } from '@domains/shared/errors/invalid-input-error';

describe('UserIdentityService', () => {
  it('resolves an already-linked auth identity', async () => {
    const usersRepository = new DrizzleUsersRepository(getTestDatabase().db);
    const service = new UserIdentityService(usersRepository);
    const user = await insertUser({ email: 'linked@example.com', displayName: 'Linked User' });

    await insertAuthIdentity({
      userId: user.id,
      provider: AuthProvider.Supabase,
      providerUserId: 'supabase-linked-user',
    });

    const principal = await service.resolveAuthenticatedPrincipal({
      provider: AuthProvider.Supabase,
      providerUserId: 'supabase-linked-user',
      email: null,
      emailVerified: false,
      displayName: null,
    });

    expect(principal).toEqual({
      principalId: user.id,
      email: 'linked@example.com',
      displayName: 'Linked User',
      provider: AuthProvider.Supabase,
      providerUserId: 'supabase-linked-user',
    });
  });

  it('links a verified email match to an existing user', async () => {
    const usersRepository = new DrizzleUsersRepository(getTestDatabase().db);
    const service = new UserIdentityService(usersRepository);
    const user = await insertUser({ email: 'existing@example.com', displayName: 'Existing User' });

    const principal = await service.resolveAuthenticatedPrincipal({
      provider: AuthProvider.Supabase,
      providerUserId: 'supabase-existing-user',
      email: 'existing@example.com',
      emailVerified: true,
      displayName: 'Supabase Existing User',
    });

    const linkedUser = await usersRepository.findByAuthIdentity({
      provider: AuthProvider.Supabase,
      providerUserId: 'supabase-existing-user',
    });

    expect(principal.principalId).toBe(user.id);
    expect(principal.email).toBe('existing@example.com');
    expect(linkedUser?.id).toBe(user.id);
  });

  it('provisions a new active user when no domain user exists', async () => {
    const usersRepository = new DrizzleUsersRepository(getTestDatabase().db);
    const service = new UserIdentityService(usersRepository);

    const principal = await service.resolveAuthenticatedPrincipal({
      provider: AuthProvider.Supabase,
      providerUserId: 'supabase-new-user',
      email: 'new-user@example.com',
      emailVerified: true,
      displayName: '  New User  ',
    });

    const createdUser = await usersRepository.findById(principal.principalId);
    const linkedUser = await usersRepository.findByAuthIdentity({
      provider: AuthProvider.Supabase,
      providerUserId: 'supabase-new-user',
    });

    expect(createdUser?.email).toBe('new-user@example.com');
    expect(createdUser?.displayName).toBe('New User');
    expect(createdUser?.isActive).toBe(true);
    expect(linkedUser?.id).toBe(principal.principalId);
  });

  it('fails closed when there is no linked identity and the email is unverified', async () => {
    const service = new UserIdentityService(new DrizzleUsersRepository(getTestDatabase().db));

    await expect(
      service.resolveAuthenticatedPrincipal({
        provider: AuthProvider.Supabase,
        providerUserId: 'supabase-unverified-user',
        email: 'unverified@example.com',
        emailVerified: false,
        displayName: 'Unverified User',
      }),
    ).rejects.toBeInstanceOf(AccessDeniedError);
  });

  it('fails closed when there is no linked identity and the email is missing', async () => {
    const service = new UserIdentityService(new DrizzleUsersRepository(getTestDatabase().db));

    await expect(
      service.resolveAuthenticatedPrincipal({
        provider: AuthProvider.Supabase,
        providerUserId: 'supabase-missing-email',
        email: '   ',
        emailVerified: true,
        displayName: 'Missing Email User',
      }),
    ).rejects.toBeInstanceOf(InvalidInputError);
  });

  it('fails closed for deactivated users even when the auth identity is linked', async () => {
    const usersRepository = new DrizzleUsersRepository(getTestDatabase().db);
    const service = new UserIdentityService(usersRepository);
    const user = await insertUser({
      email: 'deactivated@example.com',
      displayName: 'Deactivated User',
      isActive: false,
    });

    await insertAuthIdentity({
      userId: user.id,
      provider: AuthProvider.Supabase,
      providerUserId: 'supabase-deactivated-user',
    });

    await expect(
      service.resolveAuthenticatedPrincipal({
        provider: AuthProvider.Supabase,
        providerUserId: 'supabase-deactivated-user',
        email: 'deactivated@example.com',
        emailVerified: true,
        displayName: 'Deactivated User',
      }),
    ).rejects.toBeInstanceOf(AccessDeniedError);
  });
});
