import { Chat, ChatProps } from '@domains/chats/entities/chat-session';
import { ChatMessage } from '@domains/chats/entities/chat-message';

export type CreateChatRepoInput = Omit<ChatProps, 'archivedAt' | 'createdAt' | 'updatedAt'>;

export type UpdateChatRepoInput = Partial<
  Omit<CreateChatRepoInput, 'id' | 'workspaceId' | 'ownerUserId'>
>;

export type GetUserOwnedChatMessagesParams = {
  chatId: string;
  workspaceId: string;
  principalId: string;
};

export type AppendMessagesParams = {
  chatId: string;
  messages: ChatMessage[];
};

export interface IChatRepository {
  createChat(input: CreateChatRepoInput): Promise<Chat>;
  findChatById(id: string): Promise<Chat | null>;
  listOwnerChats(params: { workspaceId: string; ownerUserId: string }): Promise<Chat[]>;
  updateChatById(id: string, input: UpdateChatRepoInput): Promise<Chat>;
  archiveChatById(id: string): Promise<void>;

  /**
   * Queries the chat messages of the provided chatId contingent on the user being the owner of the chat.
   * Performs no validation of the chat or the user. Returns an empty array if:
   * - The chat is not found
   * - The user is not the owner of the chat
   * - The chat has no messages
   */
  getUserOwnedChatMessages(params: GetUserOwnedChatMessagesParams): Promise<ChatMessage[]>;

  /**
   * Appends the provided messages to the chat.
   */
  appendChatMessages(params: AppendMessagesParams): Promise<void>;
}
