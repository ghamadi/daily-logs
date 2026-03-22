import { sql } from 'drizzle-orm';
import { pgTable, uuid, smallint, varchar, timestamp, index, check } from 'drizzle-orm/pg-core';
import { sqlEnumValues } from '../utils';
import { UsersTable } from './users-table';
import { WorkspacesTable } from './workspaces-table';
import { EventType } from '@domains/events/value-objects/event-type';
import { EventStatus } from '@domains/events/value-objects/event-status';
import { EventSource } from '@domains/events/value-objects/event-source';

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
    type: smallint('type').$type<EventType>().notNull().default(EventType.Note),
    status: smallint('status').$type<EventStatus>().notNull().default(EventStatus.Confirmed),
    happenedAt: timestamp('happened_at', { withTimezone: true }).notNull(),
    summary: varchar('summary', { length: 280 }).notNull().default(''),
    source: smallint('source').$type<EventSource>().notNull().default(EventSource.User),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('events_type_chk', sql`${t.type} in (${sqlEnumValues(EventType)})`),
    check('events_status_chk', sql`${t.status} in (${sqlEnumValues(EventStatus)})`),
    index('events_workspace_id_happened_at_idx').on(t.workspaceId, t.happenedAt),
    index('events_workspace_id_type_happened_at_idx').on(t.workspaceId, t.type, t.happenedAt),
    index('events_workspace_id_status_happened_at_idx').on(t.workspaceId, t.status, t.happenedAt),
  ],
);

export type DbEvent = typeof EventsTable.$inferSelect;
