import { randomUUID } from 'node:crypto';

import { DrizzleEventsRepository } from '@infrastructure/repositories/events/drizzle-events-repository';
import { EventSource } from '@domains/events/value-objects/event-source';
import { EventStatus } from '@domains/events/value-objects/event-status';
import { WorkspaceRole } from '@domains/workspaces/value-objects/workspace-role';

import { getTestDatabase } from '../helpers/test-database';
import { insertEvent, insertUser, insertWorkspace, insertWorkspaceMember } from '../helpers/seed-data';

describe('DrizzleEventsRepository', () => {
  it('creates events and finds them by id', async () => {
    const repository = new DrizzleEventsRepository(getTestDatabase().db);
    const owner = await insertUser({ email: 'owner@example.com' });
    const workspace = await insertWorkspace({ ownerUserId: owner.id, name: 'Events' });
    await insertWorkspaceMember({ workspaceId: workspace.id, userId: owner.id, role: WorkspaceRole.OWNER });

    const event = await repository.create({
      id: randomUUID(),
      workspaceId: workspace.id,
      userId: owner.id,
      status: EventStatus.PROPOSED,
      source: EventSource.USER,
      happenedAt: new Date('2026-03-22T16:00:00.000Z'),
      summary: 'Draft note',
      createdAt: new Date('2026-03-22T16:00:00.000Z'),
      updatedAt: new Date('2026-03-22T16:00:00.000Z'),
    });

    const found = await repository.findById(event.id);

    expect(found?.id).toBe(event.id);
    expect(found?.status).toBe(EventStatus.PROPOSED);
    expect(found?.summary).toBe('Draft note');
  });

  it('lists workspace events in reverse chronological order with pagination', async () => {
    const repository = new DrizzleEventsRepository(getTestDatabase().db);
    const owner = await insertUser({ email: 'owner@example.com' });
    const workspace = await insertWorkspace({ ownerUserId: owner.id, name: 'Timeline' });
    await insertWorkspaceMember({ workspaceId: workspace.id, userId: owner.id, role: WorkspaceRole.OWNER });

    await insertEvent({
      workspaceId: workspace.id,
      userId: owner.id,
      summary: 'Oldest',
      happenedAt: new Date('2026-03-22T10:00:00.000Z'),
      createdAt: new Date('2026-03-22T10:00:00.000Z'),
      updatedAt: new Date('2026-03-22T10:00:00.000Z'),
    });
    await insertEvent({
      workspaceId: workspace.id,
      userId: owner.id,
      summary: 'Middle',
      happenedAt: new Date('2026-03-22T11:00:00.000Z'),
      createdAt: new Date('2026-03-22T11:00:00.000Z'),
      updatedAt: new Date('2026-03-22T11:00:00.000Z'),
    });
    await insertEvent({
      workspaceId: workspace.id,
      userId: owner.id,
      summary: 'Newest',
      happenedAt: new Date('2026-03-22T12:00:00.000Z'),
      createdAt: new Date('2026-03-22T12:00:00.000Z'),
      updatedAt: new Date('2026-03-22T12:00:00.000Z'),
    });

    const firstPage = await repository.findByWorkspace(workspace.id, { limit: 2, offset: 0 });
    const secondPage = await repository.findByWorkspace(workspace.id, { limit: 1, offset: 2 });

    expect(firstPage.map((event) => event.summary)).toEqual(['Newest', 'Middle']);
    expect(secondPage.map((event) => event.summary)).toEqual(['Oldest']);
  });

  it('updates and deletes events by id', async () => {
    const repository = new DrizzleEventsRepository(getTestDatabase().db);
    const owner = await insertUser({ email: 'owner@example.com' });
    const workspace = await insertWorkspace({ ownerUserId: owner.id, name: 'Updates' });
    await insertWorkspaceMember({ workspaceId: workspace.id, userId: owner.id, role: WorkspaceRole.OWNER });

    const event = await insertEvent({
      workspaceId: workspace.id,
      userId: owner.id,
      summary: 'Needs update',
      status: EventStatus.PROPOSED,
      happenedAt: new Date('2026-03-22T17:00:00.000Z'),
    });

    const updated = await repository.updateById(event.id, {
      summary: 'Updated note',
      status: EventStatus.CONFIRMED,
      updatedAt: new Date('2026-03-22T17:05:00.000Z'),
    });

    expect(updated.summary).toBe('Updated note');
    expect(updated.status).toBe(EventStatus.CONFIRMED);

    await repository.deleteById(event.id);

    await expect(repository.findById(event.id)).resolves.toBeNull();
  });
});
