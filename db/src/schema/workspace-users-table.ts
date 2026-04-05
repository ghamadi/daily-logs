import { pgTable, uuid, timestamp, uniqueIndex, index, pgEnum } from 'drizzle-orm/pg-core';
import { UsersTable } from './users-table';
import { WorkspacesTable } from './workspaces-table';

export const workspaceUsersRoleEnum = pgEnum('role', ['owner', 'admin', 'member']);

/**
 * Workspace memberships
 * - Many users can belong to many workspaces.
 */
export const WorkspaceUsersTable = pgTable(
  'workspace_users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => WorkspacesTable.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => UsersTable.id, { onDelete: 'cascade' }),
    role: workspaceUsersRoleEnum().notNull().default('member'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('workspace_users_workspace_id_user_id_uq').on(t.workspaceId, t.userId),
    index('workspace_users_user_id_idx').on(t.userId),
  ],
);

export type DbWorkspaceUser = typeof WorkspaceUsersTable.$inferSelect;
export type DbWorkspaceUserRole = DbWorkspaceUser['role'];
