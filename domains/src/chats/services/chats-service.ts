import { DomainErrors } from '@domains/lib/errors';
import {
  IChatRepository,
  SetMessagesParams,
  UpdateChatRepoInput,
} from '@domains/chats/repositories/chat-repository';
import { IWorkspacesRepository } from '@domains/workspaces/repositories/workspaces-repository';
import { ChatMessage } from '@domains/chats/client';

export type CreateChatInput = {
  chatId: string;
  workspaceId: string;
  principalId: string;
  title?: string;
};

export type UpdateChatInput = UpdateChatRepoInput;

type ChatScopedActionParams = {
  chatId: string;
  workspaceId: string;
  principalId: string;
};

export class ChatsService {
  constructor(
    private readonly chatsRepo: IChatRepository,
    private readonly workspacesRepo: IWorkspacesRepository,
  ) {}

  async ensureChat(props: CreateChatInput) {
    const { chatId, workspaceId, principalId, title = 'New Chat' } = props;
    await this.assertWorkspaceMembership(workspaceId, principalId);

    const existing = await this.chatsRepo.findChatById(chatId);
    if (!existing) {
      return await this.chatsRepo.createChat({
        id: chatId,
        workspaceId,
        ownerUserId: principalId,
        title,
      });
    }

    if (existing.workspaceId !== workspaceId || existing.ownerUserId !== principalId) {
      throw new DomainErrors.ConflictError('Chat ID is already in use.');
    }

    return existing;
  }

  async listChats(props: { workspaceId: string; principalId: string }) {
    const { workspaceId, principalId } = props;
    await this.assertWorkspaceMembership(workspaceId, principalId);

    return this.chatsRepo.listOwnerChats({ workspaceId, ownerUserId: principalId });
  }

  async getChatById(props: ChatScopedActionParams) {
    return this.requireOwnedChat(props);
  }

  async updateChat(props: ChatScopedActionParams & { input: UpdateChatInput }) {
    const { chatId, workspaceId, principalId, input } = props;
    await this.requireOwnedChat({ chatId, workspaceId, principalId });

    return this.chatsRepo.updateChatById(chatId, input);
  }

  async archiveChat(props: ChatScopedActionParams) {
    const { chatId, workspaceId, principalId } = props;
    await this.requireOwnedChat({ chatId, workspaceId, principalId });

    await this.chatsRepo.archiveChatById(chatId);
  }

  async loadChatMessages(props: ChatScopedActionParams) {
    const { chatId, workspaceId, principalId } = props;

    return await this.chatsRepo.getUserOwnedChatMessages({ chatId, workspaceId, principalId });
  }

  async appendMessages(props: ChatScopedActionParams & { messages: ChatMessage[] }) {
    const { chatId, workspaceId, principalId, messages } = props;

    await this.requireOwnedChat({ chatId, workspaceId, principalId });

    await this.chatsRepo.appendChatMessages({ chatId, messages });
  }

  async setMessages(params: ChatScopedActionParams & SetMessagesParams) {
    const {
      chatId,
      workspaceId,
      principalId,
      newMessages,
      discardedMessageIds: deletedMessageIds,
    } = params;

    await this.requireOwnedChat({ chatId, workspaceId, principalId });

    await this.chatsRepo.setChatMessages({
      chatId,
      newMessages,
      discardedMessageIds: deletedMessageIds,
    });
  }

  async requireOwnedChat(props: ChatScopedActionParams) {
    const { chatId, workspaceId, principalId } = props;
    const chat = await this.chatsRepo.findChatById(chatId);

    // A chat in a different workspace is treated as not-found here so we never
    // confirm cross-workspace existence to a caller who shouldn't know.
    if (!chat || chat.workspaceId !== workspaceId) {
      throw new DomainErrors.NotFoundError('Chat not found', { id: chatId, workspaceId, principalId });
    }

    await this.assertWorkspaceMembership(workspaceId, principalId);

    if (!chat.isOwnedBy(principalId)) {
      throw new DomainErrors.AccessDeniedError('Only the chat owner can access this chat');
    }

    return chat;
  }

  // ── helpers ──────────────────────────────────────────────

  private async assertWorkspaceMembership(workspaceId: string, principalId: string) {
    const isMember = await this.workspacesRepo.isMember({ workspaceId, memberId: principalId });
    if (!isMember) {
      throw new DomainErrors.AccessDeniedError('User is not a member of this workspace');
    }
  }
}
