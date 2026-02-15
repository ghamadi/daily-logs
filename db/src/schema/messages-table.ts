import { sql } from 'drizzle-orm';
import {
  pgTable,
  bigserial,
  uuid,
  smallint,
  varchar,
  text,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core';

import { MessageChannel, MessageDirection, MessageType } from './enums';
import { sqlEnumValues } from '../utils';
import { UsersTable } from './users-table';
import { WorkspacesTable } from './workspaces-table';

/**
 * Messages
 * - Stores inbound/outbound communication (WhatsApp, web, etc).
 * - Keep raw large payloads in metadata; avoid storing binaries here.
 */
export const MessagesTable = pgTable(
  'messages',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => WorkspacesTable.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => UsersTable.id, { onDelete: 'set null' }),
    channel: smallint('channel').$type<MessageChannel>().notNull().default(MessageChannel.Unknown),
    direction: smallint('direction').$type<MessageDirection>().notNull().default(MessageDirection.Unknown),
    type: smallint('type').$type<MessageType>().notNull().default(MessageType.Text),
    externalId: varchar('external_id', { length: 200 }),
    content: text('content').notNull().default(''),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('messages_channel_chk', sql`${t.channel} in (${sqlEnumValues(MessageChannel)})`),
    check('messages_direction_chk', sql`${t.direction} in (${sqlEnumValues(MessageDirection)})`),
    check('messages_type_chk', sql`${t.type} in (${sqlEnumValues(MessageType)})`),
    index('messages_workspace_id_created_at_idx').on(t.workspaceId, t.createdAt),
    index('messages_workspace_id_channel_idx').on(t.workspaceId, t.channel),
    uniqueIndex('messages_workspace_id_channel_external_id_uq').on(t.workspaceId, t.channel, t.externalId),
  ],
);
