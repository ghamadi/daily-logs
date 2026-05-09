import { pgTable, uuid, varchar, jsonb, timestamp, index, pgEnum } from 'drizzle-orm/pg-core';
import { ChatSessionsTable } from './chat-sessions-table';
import type { ChatMessagePayload } from '@web/lib/chat/types';

export const CHAT_MESSAGE_ROLES = ['user', 'assistant', 'system'] as const;

export const chatMessageRoleEnum = pgEnum('chat_message_role', CHAT_MESSAGE_ROLES);

/**
 * Chat messages
 * - `id` is supplied by the AI SDK v6 message-id generator (`msg_<16-char-id>`),
 *   so the column is a varchar rather than a UUID.
 * - `payload` stores the raw AI SDK v6 `UIMessage` JSON. We type it via a shared
 *   alias from `@web` (type-only import) so downstream consumers get full inference
 *   without leaking the `ai` package dependency into `db`.
 */
export const ChatMessagesTable = pgTable(
  'chat_messages',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => ChatSessionsTable.id, { onDelete: 'cascade' }),
    role: chatMessageRoleEnum().notNull(),
    payload: jsonb('payload').$type<ChatMessagePayload>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('chat_messages_session_id_created_at_idx').on(t.sessionId, t.createdAt)],
);

export type DbChatMessage = typeof ChatMessagesTable.$inferSelect;
export type DbChatMessageRole = DbChatMessage['role'];
