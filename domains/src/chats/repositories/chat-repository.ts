import { Chat, ChatProps } from '../entities/chat-session';
import { ChatMessage, ChatMessageProps } from '../entities/chat-message';

export type CreateChatRepoInput = Omit<ChatProps, 'archivedAt' | 'createdAt' | 'updatedAt'>;

export type UpdateChatRepoInput = Partial<
  Omit<CreateChatRepoInput, 'id' | 'workspaceId' | 'ownerUserId'>
>;

export type ChatMessageInput = Pick<ChatMessageProps, 'id' | 'payload'>;

export interface IChatRepository {
  createChat(input: CreateChatRepoInput): Promise<Chat>;
  findChatById(id: string): Promise<Chat | null>;
  listOwnerChats(params: { workspaceId: string; ownerUserId: string }): Promise<Chat[]>;
  updateChat(id: string, input: UpdateChatRepoInput): Promise<Chat>;
  archiveChat(id: string): Promise<void>;

  loadMessages(chatId: string): Promise<ChatMessage[]>;
  appendMessages(chatId: string, messages: ChatMessageInput[]): Promise<void>;
}
