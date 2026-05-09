import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { UsersTable } from './users-table';
import { WorkspacesTable } from './workspaces-table';

/**
 * Chat sessions
 * - Each session belongs to a workspace and is private to its owner until sharing exists.
 * - `archived_at` enables soft-archive; archived sessions are excluded from default listings.
 */
export const ChatSessionsTable = pgTable(
  'chat_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => WorkspacesTable.id, { onDelete: 'cascade' }),
    ownerUserId: uuid('owner_user_id')
      .notNull()
      .references(() => UsersTable.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 160 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
  },
  (t) => [
    index('chat_sessions_workspace_id_owner_user_id_updated_at_idx').on(
      t.workspaceId,
      t.ownerUserId,
      t.updatedAt,
    ),
  ],
);

export type DbChatSession = typeof ChatSessionsTable.$inferSelect;
