import { sql } from 'drizzle-orm';
import { pgTable, uuid, smallint, timestamp, uniqueIndex, index, check } from 'drizzle-orm/pg-core';
import { sqlEnumValues } from '../utils';
import { UsersTable } from './users-table';
import { WorkspacesTable } from './workspaces-table';
import { WorkspaceRole } from '@domains/workspaces/value-objects/workspace-role';

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
    role: smallint('role').$type<WorkspaceRole>().notNull().default(WorkspaceRole.Member),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('workspace_users_role_chk', sql`${t.role} in (${sqlEnumValues(WorkspaceRole)})`),
    uniqueIndex('workspace_users_workspace_id_user_id_uq').on(t.workspaceId, t.userId),
    index('workspace_users_user_id_idx').on(t.userId),
  ],
);

export type DbWorkspaceUser = typeof WorkspaceUsersTable.$inferSelect;
