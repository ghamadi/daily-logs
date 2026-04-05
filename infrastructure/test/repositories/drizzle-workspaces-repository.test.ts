import { randomUUID } from 'node:crypto';

import { DrizzleWorkspacesRepository } from '@infrastructure/repositories/workspaces/drizzle-workspaces-repository';
import { WorkspaceRole } from '@domains/workspaces/value-objects/workspace-role';

import { getTestDatabase } from '../helpers/test-database';
import { insertUser } from '../helpers/seed-data';

describe('DrizzleWorkspacesRepository', () => {
  it('creates a workspace and the owner membership in one operation', async () => {
    const repository = new DrizzleWorkspacesRepository(getTestDatabase().db);
    const owner = await insertUser({ email: 'owner@example.com' });
    const createdAt = new Date('2026-03-22T13:00:00.000Z');
    const updatedAt = new Date('2026-03-22T13:00:00.000Z');

    const workspace = await repository.createWorkspaceWithOwner({
      id: randomUUID(),
      ownerUserId: owner.id,
      name: 'Personal',
      createdAt,
      updatedAt,
    });

    const ownerMember = await repository.getOwner({ workspaceId: workspace.id });
    const members = await repository.listMembers(workspace.id);

    expect(workspace.ownerId).toBe(owner.id);
    expect(ownerMember.userId).toBe(owner.id);
    expect(ownerMember.role).toBe(WorkspaceRole.OWNER);
    expect(members).toHaveLength(1);
    expect(members[0]?.userId).toBe(owner.id);
  });

  it('adds members and updates their roles', async () => {
    const repository = new DrizzleWorkspacesRepository(getTestDatabase().db);
    const owner = await insertUser({ email: 'owner@example.com' });
    const member = await insertUser({ email: 'member@example.com' });

    const workspace = await repository.createWorkspaceWithOwner({
      id: randomUUID(),
      ownerUserId: owner.id,
      name: 'Team',
      createdAt: new Date('2026-03-22T14:00:00.000Z'),
      updatedAt: new Date('2026-03-22T14:00:00.000Z'),
    });

    const added = await repository.addMember({
      workspaceId: workspace.id,
      memberId: member.id,
      role: WorkspaceRole.ADMIN,
    });

    const updated = await repository.updateRole({
      workspaceId: workspace.id,
      memberId: member.id,
      role: WorkspaceRole.MEMBER,
    });

    const found = await repository.findMember({ workspaceId: workspace.id, memberId: member.id });

    expect(added.role).toBe(WorkspaceRole.ADMIN);
    expect(updated.role).toBe(WorkspaceRole.MEMBER);
    expect(found?.role).toBe(WorkspaceRole.MEMBER);
  });

  it('removes members and deletes workspaces', async () => {
    const repository = new DrizzleWorkspacesRepository(getTestDatabase().db);
    const owner = await insertUser({ email: 'owner@example.com' });
    const member = await insertUser({ email: 'member@example.com' });

    const workspace = await repository.createWorkspaceWithOwner({
      id: randomUUID(),
      ownerUserId: owner.id,
      name: 'Cleanup',
      createdAt: new Date('2026-03-22T15:00:00.000Z'),
      updatedAt: new Date('2026-03-22T15:00:00.000Z'),
    });

    await repository.addMember({
      workspaceId: workspace.id,
      memberId: member.id,
      role: WorkspaceRole.MEMBER,
    });

    await repository.removeMember({ workspaceId: workspace.id, memberId: member.id });

    await expect(repository.findMember({ workspaceId: workspace.id, memberId: member.id })).resolves.toBeNull();

    await repository.deleteById(workspace.id);

    await expect(repository.findById(workspace.id)).resolves.toBeNull();
  });
});
