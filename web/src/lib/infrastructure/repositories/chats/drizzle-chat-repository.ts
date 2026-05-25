import { and, asc, desc, eq, isNull } from 'drizzle-orm';

import type { Database } from '@db/client/create-db';
import { ChatMessagesTable, ChatsTable } from '@db/schema';
import { Chat } from '@domains/chats/entities/chat-session';
import { ChatMessage } from '@domains/chats/entities/chat-message';
import type {
  AppendMessageInput,
  CreateChatRepoInput,
  IChatRepository,
  UpdateChatRepoInput,
} from '@domains/chats/repositories/chat-repository';
import { assertNotNullish } from '@utils/assertions';

export class DrizzleChatRepository implements IChatRepository {
  constructor(private readonly db: Database) {}

  async createChat(input: CreateChatRepoInput): Promise<Chat> {
    const [row] = await this.db.insert(ChatsTable).values(input).returning();
    assertNotNullish(row, `Failed to create chat "${input.id}".`);

    return new Chat(row);
  }

  async findChatById(id: string): Promise<Chat | null> {
    const [row = null] = await this.db.select().from(ChatsTable).where(eq(ChatsTable.id, id)).limit(1);

    return row && new Chat(row);
  }

  async listOwnerChats(params: { workspaceId: string; ownerUserId: string }): Promise<Chat[]> {
    const rows = await this.db
      .select()
      .from(ChatsTable)
      .where(
        and(
          eq(ChatsTable.workspaceId, params.workspaceId),
          eq(ChatsTable.ownerUserId, params.ownerUserId),
          isNull(ChatsTable.archivedAt),
        ),
      )
      .orderBy(desc(ChatsTable.updatedAt), asc(ChatsTable.id));

    return rows.map((row) => new Chat(row));
  }

  async updateChat(id: string, input: UpdateChatRepoInput): Promise<Chat> {
    const [row] = await this.db
      .update(ChatsTable)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(ChatsTable.id, id))
      .returning();

    assertNotNullish(row, `Failed to update chat "${id}".`);

    return new Chat(row);
  }

  async archiveChat(id: string): Promise<void> {
    const now = new Date();
    await this.db
      .update(ChatsTable)
      .set({ archivedAt: now, updatedAt: now })
      .where(eq(ChatsTable.id, id));
  }

  async loadMessages(chatId: string): Promise<ChatMessage[]> {
    const rows = await this.db
      .select()
      .from(ChatMessagesTable)
      .where(eq(ChatMessagesTable.chatId, chatId))
      .orderBy(asc(ChatMessagesTable.createdAt), asc(ChatMessagesTable.id));

    return rows.map((row) => new ChatMessage(row));
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
      chatId,
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
