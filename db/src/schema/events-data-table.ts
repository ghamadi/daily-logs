import { pgTable, uuid, jsonb, timestamp } from 'drizzle-orm/pg-core';

import { EventsTable } from './events-table';

/**
 * EventsData (heavier payload per event)
 * - One row per event (1:1). Keep large JSON/text here, not in EventsTable.
 */
export const EventsDataTable = pgTable('events_data', {
  eventId: uuid('event_id')
    .notNull()
    .references(() => EventsTable.id, { onDelete: 'cascade' })
    .primaryKey(),
  data: jsonb('data').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
