import { pgTable, uuid, varchar, timestamp, index, pgEnum } from 'drizzle-orm/pg-core';
import { UsersTable } from './users-table';
import { WorkspacesTable } from './workspaces-table';

export const eventsSourceEnum = pgEnum('source', ['user', 'assistant']);
export const eventsStatusEnum = pgEnum('status', ['proposed', 'confirmed', 'rejected']);

/**
 * Events (thin "envelope")
 * Optimized for timeline queries: workspace + happenedAt
 */
export const EventsTable = pgTable(
  'events',
  {
    id: uuid('id').primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => WorkspacesTable.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => UsersTable.id, { onDelete: 'cascade' }),
    status: eventsStatusEnum().notNull().default('confirmed'),
    happenedAt: timestamp('happened_at', { withTimezone: true }).notNull(),
    summary: varchar('summary', { length: 280 }).notNull().default(''),
    source: eventsSourceEnum().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('events_workspace_id_happened_at_idx').on(t.workspaceId, t.happenedAt),
    index('events_workspace_id_status_happened_at_idx').on(t.workspaceId, t.status, t.happenedAt),
  ],
);

export type DbEvent = typeof EventsTable.$inferSelect;
export type DbEventSource = DbEvent['source'];
export type DbEventStatus = DbEvent['status'];
