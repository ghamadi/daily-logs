import { pgTable, uuid, jsonb, timestamp, index, pgEnum } from 'drizzle-orm/pg-core';
import { ChatsTable } from './chat-sessions-table';

export const CHAT_MESSAGE_ROLES = ['user', 'assistant', 'system'] as const;

export const chatMessageRoleEnum = pgEnum('chat_message_role', CHAT_MESSAGE_ROLES);

/**
 * Structural shape of a persisted chat message payload.
 *
 * The column stores the raw AI SDK `UIMessage` JSON, but `db` stays
 * framework-agnostic and only constrains the fields it (and the domain layer)
 * actually read. `web` supplies the concrete, fully-typed `UiMessagePayload` at
 * the edges — it is structurally assignable to this type.
 */
export type StoredUiMessage = {
  id: string;
  role: (typeof CHAT_MESSAGE_ROLES)[number];
  parts: unknown[];
  metadata?: unknown;
};

/**
 * Chat messages
 * - Each message belongs to a chat and will be deleted when the chat is deleted.
 */
export const ChatMessagesTable = pgTable(
  'chat_messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    chatId: uuid('chat_id')
      .notNull()
      .references(() => ChatsTable.id, { onDelete: 'cascade' }),
    payload: jsonb('payload').$type<StoredUiMessage>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('chat_messages_session_id_created_at_idx').on(t.chatId, t.createdAt)],
);

export type DbChatMessage = typeof ChatMessagesTable.$inferSelect;
