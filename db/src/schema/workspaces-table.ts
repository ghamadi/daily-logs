import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';

import { UsersTable } from './users-table';

/**
 * Workspaces
 * - Keep it simple: a workspace has an owner.
 * - Memberships are in WorkspaceUsersTable.
 */
export const WorkspacesTable = pgTable(
  'workspaces',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerUserId: uuid('owner_user_id')
      .notNull()
      .references(() => UsersTable.id, { onDelete: 'restrict' }),
    name: varchar('name', { length: 160 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('workspaces_owner_user_id_idx').on(t.ownerUserId), index('workspaces_name_idx').on(t.name)],
);
