import { ChronicleMessagePayload } from '@/lib/ai-sdk/chronicle/types';
import { ChatMessage, ChatsService } from '@daily-logs/domains/chats';

export type SaveMessagesUseCaseParams = {
  chatId: string;
  workspaceId: string;
  principalId: string;
  messages: ChronicleMessagePayload[];
  discardedMessageIds: string[];
};

export function buildSaveMessagesUseCase(chatsService: ChatsService) {
  return async (params: SaveMessagesUseCaseParams) => {
    const { chatId, workspaceId, principalId, messages, discardedMessageIds } = params;

    // When the stream errors before the assistant emits any parts
    // (e.g., AI provider rejects the request outright), the SDK still
    // hands us a placeholder message with no parts.
    // Writing it would brick the chat: every subsequent send would fail
    // `validateUIMessages` because UIMessage parts must be non-empty.
    // So, we filter out empty messages before saving.
    const chatMessages = messages
      .map((message) => ChatMessage.fromPayload({ chatId, ...message }))
      .filter((chatMessage) => chatMessage.hasContent);

    await chatsService.setMessages({
      chatId,
      workspaceId,
      principalId,
      messages: chatMessages,
      discardedMessageIds,
    });
  };
}
