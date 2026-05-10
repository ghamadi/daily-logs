import { randomUUID } from 'crypto';
import { DomainErrors } from '@domains/lib/errors';
import {
  AppendMessageInput,
  IChatRepository,
  UpdateChatRepoInput,
} from '@domains/chats/repositories/chat-repository';
import { IWorkspacesRepository } from '@domains/workspaces/repositories/workspaces-repository';

export type CreateChatInput = {
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

  async createChat(props: CreateChatInput) {
    const { workspaceId, principalId, title = 'New Chat' } = props;
    await this.assertWorkspaceMembership(workspaceId, principalId);

    return this.chatsRepo.createChat({
      id: randomUUID(),
      workspaceId,
      ownerUserId: principalId,
      title,
    });
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

    return this.chatsRepo.updateChat(chatId, input);
  }

  async archiveChat(props: ChatScopedActionParams) {
    const { chatId, workspaceId, principalId } = props;
    await this.requireOwnedChat({ chatId, workspaceId, principalId });

    await this.chatsRepo.archiveChat(chatId);
  }

  async loadChatMessages(props: ChatScopedActionParams) {
    const { chatId, workspaceId, principalId } = props;
    await this.requireOwnedChat({ chatId, workspaceId, principalId });

    return this.chatsRepo.loadMessages(chatId);
  }

  async appendMessages(props: ChatScopedActionParams & { messages: AppendMessageInput[] }) {
    const { chatId, workspaceId, principalId, messages } = props;
    await this.requireOwnedChat({ chatId, workspaceId, principalId });

    await this.chatsRepo.appendMessages({ chatId, messages });
  }

  // ── helpers ──────────────────────────────────────────────

  private async assertWorkspaceMembership(workspaceId: string, principalId: string) {
    const isMember = await this.workspacesRepo.isMember({ workspaceId, memberId: principalId });
    if (!isMember) {
      throw new DomainErrors.AccessDeniedError('User is not a member of this workspace');
    }
  }

  private async requireOwnedChat(props: ChatScopedActionParams) {
    const { chatId, workspaceId, principalId } = props;
    const chat = await this.chatsRepo.findChatById(chatId);

    // A chat in a different workspace is treated as not-found here so we never
    // confirm cross-workspace existence to a caller who shouldn't know.
    if (!chat || chat.workspaceId !== workspaceId) {
      throw new DomainErrors.NotFoundError('Chat not found', { id: chatId });
    }

    await this.assertWorkspaceMembership(workspaceId, principalId);

    if (!chat.isOwnedBy(principalId)) {
      throw new DomainErrors.AccessDeniedError('Only the chat owner can access this chat');
    }

    return chat;
  }
}
