import { and, asc, desc, eq, isNull } from 'drizzle-orm';

import type { Database } from '@db/client/create-db';
import { ChatMessagesTable, ChatSessionsTable, type DbChatMessage } from '@db/schema';
import { ChatSession } from '@domains/chats/entities/chat-session';
import type {
  AppendMessageInput,
  ChatMessage,
  CreateChatRepoInput,
  IChatRepository,
  UpdateChatRepoInput,
} from '@domains/chats/repositories/chat-repository';
import { assertNotNullish } from '@utils/assertions';

export class DrizzleChatRepository implements IChatRepository {
  constructor(private readonly db: Database) {}

  async createChat(input: CreateChatRepoInput): Promise<ChatSession> {
    const [row] = await this.db.insert(ChatSessionsTable).values(input).returning();
    assertNotNullish(row, `Failed to create chat "${input.id}".`);

    return new ChatSession(row);
  }

  async findChatById(id: string): Promise<ChatSession | null> {
    const [row = null] = await this.db
      .select()
      .from(ChatSessionsTable)
      .where(eq(ChatSessionsTable.id, id))
      .limit(1);

    return row && new ChatSession(row);
  }

  async listOwnerChats(params: { workspaceId: string; ownerUserId: string }): Promise<ChatSession[]> {
    const rows = await this.db
      .select()
      .from(ChatSessionsTable)
      .where(
        and(
          eq(ChatSessionsTable.workspaceId, params.workspaceId),
          eq(ChatSessionsTable.ownerUserId, params.ownerUserId),
          isNull(ChatSessionsTable.archivedAt),
        ),
      )
      .orderBy(desc(ChatSessionsTable.updatedAt), asc(ChatSessionsTable.id));

    return rows.map((row) => new ChatSession(row));
  }

  async updateChat(id: string, input: UpdateChatRepoInput): Promise<ChatSession> {
    const [row] = await this.db
      .update(ChatSessionsTable)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(ChatSessionsTable.id, id))
      .returning();

    assertNotNullish(row, `Failed to update chat "${id}".`);

    return new ChatSession(row);
  }

  async archiveChat(id: string): Promise<void> {
    const now = new Date();
    await this.db
      .update(ChatSessionsTable)
      .set({ archivedAt: now, updatedAt: now })
      .where(eq(ChatSessionsTable.id, id));
  }

  async loadMessages(chatId: string): Promise<ChatMessage[]> {
    const rows = await this.db
      .select()
      .from(ChatMessagesTable)
      .where(eq(ChatMessagesTable.sessionId, chatId))
      .orderBy(asc(ChatMessagesTable.createdAt), asc(ChatMessagesTable.id));

    return rows.map(toChatMessage);
  }

  async appendMessages(params: { chatId: string; messages: AppendMessageInput[] }): Promise<void> {
    const { chatId, messages } = params;
    if (messages.length === 0) return;

    // Bulk INSERT would otherwise stamp every row with the same `now()` (Postgres
    // resolves at transaction start, not per row), so we explicitly offset each
    // row by its index in milliseconds to preserve intra-batch ordering.
    const baseTime = Date.now();
    const rows = messages.map((message, i) => ({
      id: message.id,
      sessionId: chatId,
      role: message.role,
      payload: message.payload,
      createdAt: new Date(baseTime + i),
      updatedAt: new Date(baseTime + i),
    }));

    // We dedupe on the AI-SDK-stable message id so retries from `onFinish`
    // (e.g. after client disconnect + reconnect) are idempotent. Switch to
    // `.onConflictDoUpdate(...)` once message editing is supported.
    await this.db
      .insert(ChatMessagesTable)
      .values(rows)
      .onConflictDoNothing({ target: ChatMessagesTable.id });
  }
}

function toChatMessage(row: DbChatMessage): ChatMessage {
  return {
    id: row.id,
    chatId: row.sessionId,
    role: row.role,
    payload: row.payload,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
