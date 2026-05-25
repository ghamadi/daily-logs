import type { UiMessagePayload } from '@web/lib/ai-sdk/types';
import { ChatSession, ChatSessionProps } from '../entities/chat-session';
import { ChatMessageRole } from '../value-objects/chat-message-role';

export type CreateChatRepoInput = Omit<ChatSessionProps, 'archivedAt' | 'createdAt' | 'updatedAt'>;

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
  createChat(input: CreateChatRepoInput): Promise<ChatSession>;
  findChatById(id: string): Promise<ChatSession | null>;
  listOwnerChats(params: { workspaceId: string; ownerUserId: string }): Promise<ChatSession[]>;
  updateChat(id: string, input: UpdateChatRepoInput): Promise<ChatSession>;
  archiveChat(id: string): Promise<void>;

  loadMessages(chatId: string): Promise<ChatMessage[]>;
  appendMessages(params: { chatId: string; messages: AppendMessageInput[] }): Promise<void>;
}
