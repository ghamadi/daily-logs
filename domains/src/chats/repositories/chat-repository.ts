import type { UiMessagePayload } from '@web/lib/ai-sdk/types';
import { Chat, ChatProps } from '../entities/chat-session';
import { ChatMessageRole } from '../value-objects/chat-message-role';

export type CreateChatRepoInput = Omit<ChatProps, 'archivedAt' | 'createdAt' | 'updatedAt'>;

export type UpdateChatRepoInput = Partial<
  Omit<CreateChatRepoInput, 'id' | 'workspaceId' | 'ownerUserId'>
>;

export interface ChatMessage {
  id: string;
  chatId: string;
  role: ChatMessageRole;
  payload: UiMessagePayload;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppendMessageInput {
  id: string;
  role: ChatMessageRole;
  payload: UiMessagePayload;
}

export interface IChatRepository {
  createChat(input: CreateChatRepoInput): Promise<Chat>;
  findChatById(id: string): Promise<Chat | null>;
  listOwnerChats(params: { workspaceId: string; ownerUserId: string }): Promise<Chat[]>;
  updateChat(id: string, input: UpdateChatRepoInput): Promise<Chat>;
  archiveChat(id: string): Promise<void>;

  loadMessages(chatId: string): Promise<ChatMessage[]>;
  appendMessages(params: { chatId: string; messages: AppendMessageInput[] }): Promise<void>;
}
