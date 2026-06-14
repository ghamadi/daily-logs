import { and, asc, desc, eq, isNull } from 'drizzle-orm';

import type { Database } from '@daily-logs/db/client';
import {
  ChatMessagesTable,
  ChatsTable,
  DbChatMessage,
  WorkspaceUsersTable,
} from '@daily-logs/db/schema';
import {
  AppendMessagesParams,
  Chat,
  ChatMessage,
  GetUserOwnedChatMessagesParams,
  type CreateChatRepoInput,
  type IChatRepository,
  type UpdateChatRepoInput,
} from '@daily-logs/domains/chats';
import { assertNotNullish } from '@daily-logs/utils/assertions';

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

  async updateChatById(id: string, input: UpdateChatRepoInput): Promise<Chat> {
    const [row] = await this.db
      .update(ChatsTable)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(ChatsTable.id, id))
      .returning();

    assertNotNullish(row, `Failed to update chat "${id}".`);

    return new Chat(row);
  }

  async archiveChatById(id: string): Promise<void> {
    const now = new Date();
    await this.db
      .update(ChatsTable)
      .set({ archivedAt: now, updatedAt: now })
      .where(eq(ChatsTable.id, id));
  }

  async getUserOwnedChatMessages(params: GetUserOwnedChatMessagesParams): Promise<ChatMessage[]> {
    const { chatId, workspaceId, principalId } = params;

    const rows = await this.db
      .select({
        id: ChatMessagesTable.id,
        chatId: ChatMessagesTable.chatId,
        role: ChatMessagesTable.role,
        payload: ChatMessagesTable.payload,
        createdAt: ChatMessagesTable.createdAt,
        updatedAt: ChatMessagesTable.updatedAt,
      })
      .from(ChatMessagesTable)
      .innerJoin(ChatsTable, eq(ChatMessagesTable.chatId, ChatsTable.id))
      .innerJoin(WorkspaceUsersTable, eq(ChatsTable.workspaceId, WorkspaceUsersTable.workspaceId))
      .where(
        and(
          eq(ChatMessagesTable.chatId, chatId),
          eq(ChatsTable.workspaceId, workspaceId),
          eq(WorkspaceUsersTable.userId, principalId),
        ),
      )
      .orderBy(asc(ChatMessagesTable.createdAt), asc(ChatMessagesTable.id));

    return rows.map((row) => new ChatMessage(row));
  }

  async appendChatMessages(params: AppendMessagesParams): Promise<void> {
    const { chatId, messages } = params;

    if (messages.length === 0) {
      return;
    }

    // Bulk INSERT would otherwise stamp every row with the same `now()` (Postgres
    // resolves at transaction start, not per row), so we explicitly offset each
    // row by its index in milliseconds to preserve intra-batch ordering.
    const baseTime = Date.now();
    const rows: DbChatMessage[] = messages.map((message, i) => ({
      id: message.id,
      chatId,
      role: message.role,
      payload: message.payload,
      createdAt: new Date(baseTime + i),
      updatedAt: new Date(baseTime + i),
    }));

    // We dedupe on the message id so retries from `onFinish`
    // (e.g. after client disconnect + reconnect) are idempotent. Switch to
    // `.onConflictDoUpdate(...)` once message editing is supported.
    await this.db
      .insert(ChatMessagesTable)
      .values(rows)
      .onConflictDoNothing({ target: ChatMessagesTable.id });
  }
}
