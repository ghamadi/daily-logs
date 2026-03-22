import { randomUUID } from 'node:crypto';

import { DrizzleUsersRepository } from '@infrastructure/repositories/users/drizzle-users-repository';

import { getTestDatabase } from '../helpers/test-database';

describe('DrizzleUsersRepository', () => {
  it('creates users and finds them by id and email', async () => {
    const repository = new DrizzleUsersRepository(getTestDatabase().db);
    const id = randomUUID();
    const createdAt = new Date('2026-03-22T10:00:00.000Z');
    const updatedAt = new Date('2026-03-22T10:05:00.000Z');

    const created = await repository.create({
      id,
      email: 'owner@example.com',
      displayName: 'Owner',
      isActive: true,
      createdAt,
      updatedAt,
    });

    const foundById = await repository.findById(id);
    const foundByEmail = await repository.findByEmail('owner@example.com');

    expect(created.id).toBe(id);
    expect(created.displayName).toBe('Owner');
    expect(foundById?.email).toBe('owner@example.com');
    expect(foundByEmail?.id).toBe(id);
  });

  it('updates users by id', async () => {
    const repository = new DrizzleUsersRepository(getTestDatabase().db);
    const created = await repository.create({
      id: randomUUID(),
      email: 'member@example.com',
      displayName: 'Member',
      isActive: true,
      createdAt: new Date('2026-03-22T11:00:00.000Z'),
      updatedAt: new Date('2026-03-22T11:00:00.000Z'),
    });

    const updated = await repository.updateById(created.id, {
      displayName: 'Updated Member',
      isActive: false,
      updatedAt: new Date('2026-03-22T11:10:00.000Z'),
    });

    const reloaded = await repository.findById(created.id);

    expect(updated.displayName).toBe('Updated Member');
    expect(updated.isActive).toBe(false);
    expect(reloaded?.displayName).toBe('Updated Member');
    expect(reloaded?.isActive).toBe(false);
  });

  it('deletes users by id', async () => {
    const repository = new DrizzleUsersRepository(getTestDatabase().db);
    const created = await repository.create({
      id: randomUUID(),
      email: 'delete-me@example.com',
      displayName: 'Delete Me',
      isActive: true,
      createdAt: new Date('2026-03-22T12:00:00.000Z'),
      updatedAt: new Date('2026-03-22T12:00:00.000Z'),
    });

    await repository.deleteById(created.id);

    await expect(repository.findById(created.id)).resolves.toBeNull();
    await expect(repository.findByEmail('delete-me@example.com')).resolves.toBeNull();
  });
});
