import { pgTable, uuid, jsonb, timestamp, index, pgEnum } from 'drizzle-orm/pg-core';
import { ChatsTable } from './chat-sessions-table';
import type { UiMessagePayload } from '@web/lib/ai-sdk/types';

export const CHAT_MESSAGE_ROLES = ['user', 'assistant', 'system'] as const;

export const chatMessageRoleEnum = pgEnum('chat_message_role', CHAT_MESSAGE_ROLES);

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
    payload: jsonb('payload').$type<UiMessagePayload>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('chat_messages_session_id_created_at_idx').on(t.chatId, t.createdAt)],
);

export type DbChatMessage = typeof ChatMessagesTable.$inferSelect;
