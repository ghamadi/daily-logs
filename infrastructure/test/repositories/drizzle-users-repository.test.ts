import { AuthProvider } from '@domains/users/value-objects/auth-provider';
import { DrizzleUsersRepository } from '@infrastructure/repositories/users/drizzle-users-repository';

import { insertAuthIdentity, insertUser } from '../helpers/seed-data';
import { getTestDatabase } from '../helpers/test-database';

const UUID_REGEXP = /^[0-9a-f-]{36}$/;

describe('DrizzleUsersRepository', () => {
  it('creates users and finds them by id and email', async () => {
    const repository = new DrizzleUsersRepository(getTestDatabase().db);

    const created = await repository.create({
      email: 'owner@example.com',
      displayName: 'Owner',
      isActive: true,
    });

    const foundById = await repository.findById(created.id);
    const foundByEmail = await repository.findByEmail('owner@example.com');

    expect(created.id).toMatch(UUID_REGEXP);
    expect(created.displayName).toBe('Owner');
    expect(foundById?.email).toBe('owner@example.com');
    expect(foundByEmail?.id).toBe(created.id);
  });

  it('updates users by id', async () => {
    const repository = new DrizzleUsersRepository(getTestDatabase().db);
    const created = await repository.create({
      email: 'member@example.com',
      displayName: 'Member',
      isActive: true,
    });

    const updated = await repository.updateById(created.id, {
      displayName: 'Updated Member',
      isActive: false,
    });

    const reloaded = await repository.findById(created.id);

    expect(updated.displayName).toBe('Updated Member');
    expect(updated.isActive).toBe(false);
    expect(reloaded?.displayName).toBe('Updated Member');
    expect(reloaded?.isActive).toBe(false);
  });

  it('creates users with auth identities and finds them by provider identity', async () => {
    const repository = new DrizzleUsersRepository(getTestDatabase().db);

    const created = await repository.createWithAuthIdentity({
      email: 'auth-user@example.com',
      displayName: 'Auth User',
      isActive: true,
      provider: AuthProvider.Supabase,
      providerUserId: 'supabase-user-1',
    });

    const found = await repository.findByAuthIdentity({
      provider: AuthProvider.Supabase,
      providerUserId: 'supabase-user-1',
    });

    expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(found?.id).toBe(created.id);
    expect(found?.email).toBe('auth-user@example.com');
  });

  it('links auth identities to existing users', async () => {
    const repository = new DrizzleUsersRepository(getTestDatabase().db);
    const user = await insertUser({ email: 'existing-user@example.com' });

    await repository.linkAuthIdentity({
      userId: user.id,
      provider: AuthProvider.Supabase,
      providerUserId: 'supabase-existing-user',
    });

    const found = await repository.findByAuthIdentity({
      provider: AuthProvider.Supabase,
      providerUserId: 'supabase-existing-user',
    });

    expect(found?.id).toBe(user.id);
    expect(found?.email).toBe('existing-user@example.com');
  });

  it('enforces provider identity uniqueness', async () => {
    const repository = new DrizzleUsersRepository(getTestDatabase().db);
    const firstUser = await insertUser({ email: 'first-auth@example.com' });
    const secondUser = await insertUser({ email: 'second-auth@example.com' });

    await insertAuthIdentity({
      userId: firstUser.id,
      provider: AuthProvider.Supabase,
      providerUserId: 'supabase-duplicate',
    });

    await expect(
      repository.linkAuthIdentity({
        userId: secondUser.id,
        provider: AuthProvider.Supabase,
        providerUserId: 'supabase-duplicate',
      }),
    ).rejects.toMatchObject({ cause: { code: '23505' } });
  });

  it('deletes users by id', async () => {
    const repository = new DrizzleUsersRepository(getTestDatabase().db);
    const created = await repository.create({
      email: 'delete-me@example.com',
      displayName: 'Delete Me',
      isActive: true,
    });

    await repository.deleteById(created.id);

    await expect(repository.findById(created.id)).resolves.toBeNull();
    await expect(repository.findByEmail('delete-me@example.com')).resolves.toBeNull();
  });
});
