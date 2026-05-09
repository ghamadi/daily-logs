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

  async getChatById(props: { chatId: string; principalId: string }) {
    return this.requireOwnedChat(props.chatId, props.principalId);
  }

  async updateChat(props: { chatId: string; principalId: string; input: UpdateChatInput }) {
    const { chatId, principalId, input } = props;
    await this.requireOwnedChat(chatId, principalId);

    return this.chatsRepo.updateChat(chatId, input);
  }

  async archiveChat(props: { chatId: string; principalId: string }) {
    const { chatId, principalId } = props;
    await this.requireOwnedChat(chatId, principalId);

    await this.chatsRepo.archiveChat(chatId);
  }

  async loadChatMessages(props: { chatId: string; principalId: string }) {
    const { chatId, principalId } = props;
    await this.requireOwnedChat(chatId, principalId);

    return this.chatsRepo.loadMessages(chatId);
  }

  async appendMessages(props: { chatId: string; principalId: string; messages: AppendMessageInput[] }) {
    const { chatId, principalId, messages } = props;
    await this.requireOwnedChat(chatId, principalId);

    await this.chatsRepo.appendMessages({ chatId: chatId, messages });
  }

  // ── helpers ──────────────────────────────────────────────

  private async assertWorkspaceMembership(workspaceId: string, principalId: string) {
    const isMember = await this.workspacesRepo.isMember({ workspaceId, memberId: principalId });
    if (!isMember) {
      throw new DomainErrors.AccessDeniedError('User is not a member of this workspace');
    }
  }

  private async requireOwnedChat(chatId: string, principalId: string) {
    const chat = await this.chatsRepo.findChatById(chatId);
    if (!chat) {
      throw new DomainErrors.NotFoundError('Chat not found', { id: chatId });
    }

    await this.assertWorkspaceMembership(chat.workspaceId, principalId);

    if (!chat.isOwnedBy(principalId)) {
      throw new DomainErrors.AccessDeniedError('Only the chat owner can access this chat');
    }

    return chat;
  }
}
