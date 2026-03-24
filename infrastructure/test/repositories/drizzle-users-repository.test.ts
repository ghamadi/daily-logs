import { AuthProvider } from '@domains/users/value-objects/auth-provider';
import { DrizzleUsersRepository } from '@infrastructure/repositories/users/drizzle-users-repository';

import { insertUser } from '../helpers/seed-data';
import { getTestDatabase } from '../helpers/test-database';

const UUID_REGEXP = /^[0-9a-f-]{36}$/;

describe('DrizzleUsersRepository', () => {
  it('creates users and finds them by id and email', async () => {
    const repository = new DrizzleUsersRepository(getTestDatabase().db);

    const created = await repository.create({
      email: 'owner@example.com',
      displayName: 'Owner',
      isActive: true,
      provider: AuthProvider.Supabase,
      providerUserId: 'supabase-owner',
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
      provider: AuthProvider.Supabase,
      providerUserId: 'supabase-member',
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

  it('optionally requires an auth identity when finding by email', async () => {
    const repository = new DrizzleUsersRepository(getTestDatabase().db);

    const linkedUser = await repository.create({
      email: 'linked@example.com',
      displayName: 'Linked User',
      isActive: true,
      provider: AuthProvider.Supabase,
      providerUserId: 'supabase-linked',
    });

    await insertUser({
      email: 'unlinked@example.com',
      displayName: 'Unlinked User',
      isActive: true,
    });

    const foundLinkedUser = await repository.findByEmail('linked@example.com', {
      provider: AuthProvider.Supabase,
      providerUserId: 'supabase-linked',
    });
    const foundUnlinkedUser = await repository.findByEmail('unlinked@example.com', {
      provider: AuthProvider.Supabase,
      providerUserId: 'supabase-unlinked',
    });

    expect(foundLinkedUser?.id).toBe(linkedUser.id);
    expect(foundUnlinkedUser).toBeNull();
  });

  it('creates users with auth identities and finds them by matching email and provider identity', async () => {
    const repository = new DrizzleUsersRepository(getTestDatabase().db);

    const created = await repository.create({
      email: 'auth-user@example.com',
      displayName: 'Auth User',
      isActive: true,
      provider: AuthProvider.Supabase,
      providerUserId: 'supabase-user-1',
    });

    const found = await repository.findByEmail('auth-user@example.com', {
      provider: AuthProvider.Supabase,
      providerUserId: 'supabase-user-1',
    });

    expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(found?.id).toBe(created.id);
    expect(found?.email).toBe('auth-user@example.com');
  });

  it('does not return unlinked users when finding by email with provider identity', async () => {
    const repository = new DrizzleUsersRepository(getTestDatabase().db);
    const user = await insertUser({ email: 'existing-user@example.com' });

    const found = await repository.findByEmail('existing-user@example.com', {
      provider: AuthProvider.Supabase,
      providerUserId: 'supabase-existing-user',
    });

    expect(user.email).toBe('existing-user@example.com');
    expect(found).toBeNull();
  });

  it('does not return a user when the provider identity belongs to a different user', async () => {
    const repository = new DrizzleUsersRepository(getTestDatabase().db);

    const linkedUser = await repository.create({
      email: 'linked-user@example.com',
      displayName: 'Linked User',
      isActive: true,
      provider: AuthProvider.Supabase,
      providerUserId: 'supabase-linked-user',
    });

    const otherUser = await repository.create({
      email: 'other-user@example.com',
      displayName: 'Other User',
      isActive: true,
      provider: AuthProvider.Supabase,
      providerUserId: 'supabase-other-user',
    });

    const found = await repository.findByEmail(linkedUser.email, {
      provider: AuthProvider.Supabase,
      providerUserId: 'supabase-other-user',
    });

    expect(otherUser.id).not.toBe(linkedUser.id);
    expect(found).toBeNull();
  });

  it('enforces provider identity uniqueness', async () => {
    const repository = new DrizzleUsersRepository(getTestDatabase().db);
    await repository.create({
      email: 'first-auth@example.com',
      displayName: 'First Auth User',
      isActive: true,
      provider: AuthProvider.Supabase,
      providerUserId: 'supabase-duplicate',
    });

    await expect(
      repository.create({
        email: 'second-auth@example.com',
        displayName: 'Second Auth User',
        isActive: true,
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
      provider: AuthProvider.Supabase,
      providerUserId: 'supabase-delete-me',
    });

    await repository.deleteById(created.id);

    await expect(repository.findById(created.id)).resolves.toBeNull();
    await expect(repository.findByEmail('delete-me@example.com')).resolves.toBeNull();
    await expect(
      repository.findByEmail('delete-me@example.com', {
        provider: AuthProvider.Supabase,
        providerUserId: 'supabase-delete-me',
      }),
    ).resolves.toBeNull();
  });
});
