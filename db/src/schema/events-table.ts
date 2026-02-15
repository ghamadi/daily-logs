import { sql } from 'drizzle-orm';
import { pgTable, uuid, bigint, smallint, varchar, timestamp, index, check } from 'drizzle-orm/pg-core';

import { EventStatus, EventType } from './enums';
import { sqlEnumValues } from '../utils';
import { MessagesTable } from './messages-table';
import { UsersTable } from './users-table';
import { WorkspacesTable } from './workspaces-table';

/**
 * Events (thin "envelope")
 * - Optimized for timeline queries: workspace + happenedAt
 * - Link to a message (optional) to know what created it.
 */
export const EventsTable = pgTable(
  'events',
  {
    id: uuid('id').primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => WorkspacesTable.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => UsersTable.id, { onDelete: 'set null' }),
    messageId: bigint('message_id', { mode: 'number' }).references(() => MessagesTable.id, {
      onDelete: 'set null',
    }),
    type: smallint('type').$type<EventType>().notNull().default(EventType.Note),
    status: smallint('status').$type<EventStatus>().notNull().default(EventStatus.Confirmed),
    happenedAt: timestamp('happened_at', { withTimezone: true }).notNull(),
    summary: varchar('summary', { length: 280 }).notNull().default(''),
    confidence: smallint('confidence'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('events_type_chk', sql`${t.type} in (${sqlEnumValues(EventType)})`),
    check('events_status_chk', sql`${t.status} in (${sqlEnumValues(EventStatus)})`),
    check('events_confidence_range_chk', sql`${t.confidence} is null or (${t.confidence} between 0 and 100)`),
    index('events_workspace_id_happened_at_idx').on(t.workspaceId, t.happenedAt),
    index('events_workspace_id_type_happened_at_idx').on(t.workspaceId, t.type, t.happenedAt),
    index('events_workspace_id_status_happened_at_idx').on(t.workspaceId, t.status, t.happenedAt),
    index('events_message_id_idx').on(t.messageId),
  ],
);
