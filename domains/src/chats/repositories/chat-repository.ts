import { Chat, ChatProps } from '@domains/chats/entities/chat-session';
import { ChatMessage, ChatMessageProps } from '@domains/chats/entities/chat-message';

export type CreateChatRepoInput = Omit<ChatProps, 'archivedAt' | 'createdAt' | 'updatedAt'>;

export type UpdateChatRepoInput = Partial<
  Omit<CreateChatRepoInput, 'id' | 'workspaceId' | 'ownerUserId'>
>;

export type ChatMessageInput = Pick<ChatMessageProps, 'id' | 'payload'>;

export interface IChatRepository {
  createChat(input: CreateChatRepoInput): Promise<Chat>;
  findChatById(id: string): Promise<Chat | null>;
  listOwnerChats(params: { workspaceId: string; ownerUserId: string }): Promise<Chat[]>;
  updateChatById(id: string, input: UpdateChatRepoInput): Promise<Chat>;
  archiveChatById(id: string): Promise<void>;

  loadMessagesByChatId(chatId: string): Promise<ChatMessage[]>;
  appendMessages(chatId: string, messages: ChatMessageInput[]): Promise<void>;
}
