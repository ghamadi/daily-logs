import { randomUUID } from 'node:crypto';

import { AuthIdentitiesTable, EventsTable, UsersTable, WorkspaceUsersTable, WorkspacesTable } from '@db/schema';
import { EventSource } from '@domains/events/value-objects/event-source';
import { EventStatus } from '@domains/events/value-objects/event-status';
import { EventType } from '@domains/events/value-objects/event-type';
import { AuthProvider } from '@domains/users/value-objects/auth-provider';
import { WorkspaceRole } from '@domains/workspaces/value-objects/workspace-role';

import { getTestDatabase } from './test-database';

type NewUser = typeof UsersTable.$inferInsert;
type NewAuthIdentity = typeof AuthIdentitiesTable.$inferInsert;
type NewWorkspace = typeof WorkspacesTable.$inferInsert;
type NewWorkspaceMember = typeof WorkspaceUsersTable.$inferInsert;
type NewEvent = typeof EventsTable.$inferInsert;

export async function insertUser(overrides: Partial<NewUser> = {}) {
  const { db } = getTestDatabase();
  const now = new Date();

  const [user] = await db
    .insert(UsersTable)
    .values({
      id: overrides.id ?? randomUUID(),
      email: overrides.email ?? `user-${randomUUID()}@example.com`,
      displayName: overrides.displayName ?? 'Test User',
      isActive: overrides.isActive ?? true,
      createdAt: overrides.createdAt ?? now,
      updatedAt: overrides.updatedAt ?? now,
    })
    .returning();

  if (!user) {
    throw new Error('Failed to insert test user.');
  }

  return user;
}

export async function insertAuthIdentity(overrides: Partial<NewAuthIdentity> = {}) {
  const { db } = getTestDatabase();
  const now = new Date();

  const [authIdentity] = await db
    .insert(AuthIdentitiesTable)
    .values({
      id: overrides.id ?? randomUUID(),
      userId: overrides.userId ?? randomUUID(),
      provider: overrides.provider ?? AuthProvider.Supabase,
      providerUserId: overrides.providerUserId ?? `provider-user-${randomUUID()}`,
      createdAt: overrides.createdAt ?? now,
      updatedAt: overrides.updatedAt ?? now,
    })
    .returning();

  if (!authIdentity) {
    throw new Error('Failed to insert test auth identity.');
  }

  return authIdentity;
}

export async function insertWorkspace(overrides: Partial<NewWorkspace> = {}) {
  const { db } = getTestDatabase();
  const now = new Date();

  const [workspace] = await db
    .insert(WorkspacesTable)
    .values({
      id: overrides.id ?? randomUUID(),
      ownerUserId: overrides.ownerUserId ?? randomUUID(),
      name: overrides.name ?? 'Test Workspace',
      createdAt: overrides.createdAt ?? now,
      updatedAt: overrides.updatedAt ?? now,
    })
    .returning();

  if (!workspace) {
    throw new Error('Failed to insert test workspace.');
  }

  return workspace;
}

export async function insertWorkspaceMember(overrides: Partial<NewWorkspaceMember> = {}) {
  const { db } = getTestDatabase();
  const now = new Date();

  const [member] = await db
    .insert(WorkspaceUsersTable)
    .values({
      id: overrides.id ?? randomUUID(),
      workspaceId: overrides.workspaceId ?? randomUUID(),
      userId: overrides.userId ?? randomUUID(),
      role: overrides.role ?? WorkspaceRole.Member,
      createdAt: overrides.createdAt ?? now,
      updatedAt: overrides.updatedAt ?? now,
    })
    .returning();

  if (!member) {
    throw new Error('Failed to insert test workspace member.');
  }

  return member;
}

export async function insertEvent(overrides: Partial<NewEvent> = {}) {
  const { db } = getTestDatabase();
  const now = new Date();

  const [event] = await db
    .insert(EventsTable)
    .values({
      id: overrides.id ?? randomUUID(),
      workspaceId: overrides.workspaceId ?? randomUUID(),
      userId: overrides.userId ?? randomUUID(),
      type: overrides.type ?? EventType.Note,
      status: overrides.status ?? EventStatus.Confirmed,
      happenedAt: overrides.happenedAt ?? now,
      summary: overrides.summary ?? 'Test event',
      source: overrides.source ?? EventSource.User,
      createdAt: overrides.createdAt ?? now,
      updatedAt: overrides.updatedAt ?? now,
    })
    .returning();

  if (!event) {
    throw new Error('Failed to insert test event.');
  }

  return event;
}
