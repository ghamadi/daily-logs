import { ChronicleMessagePayload } from '@/lib/ai-sdk/chronicle/types';
import { parseModelMessages, parseUiMessages } from '@/lib/ai-sdk/helpers';
import { ChronicleToolSet } from '@/lib/ai-sdk/tools/chronicle-tools';
import { ChatMessage, ChatsService } from '@domains/chats';
import { DomainErrors } from '@domains/lib/errors';

export type PrepareConversationUseCaseParams = {
  workspaceId: string;
  chatId: string;
  principalId: string;
  message: unknown;
};

export function buildPrepareConversationUseCase(chatsService: ChatsService, tools: ChronicleToolSet) {
  return async (params: PrepareConversationUseCaseParams) => {
    const { workspaceId, chatId, principalId, message } = params;

    const uiMessageParseResult = await parseUiMessages<ChronicleMessagePayload, ChronicleToolSet>({
      messages: [message],
      tools,
    });

    if (!uiMessageParseResult.success) {
      throw new DomainErrors.InvalidInputError('Invalid chat message payload.', {
        info: { cause: uiMessageParseResult.reason },
      });
    }

    const [newMessage] = uiMessageParseResult.data.messages;

    if (newMessage.role === 'system' || newMessage.role === 'assistant') {
      throw new DomainErrors.InvalidInputError('Incoming messages must be user messages.');
    }

    // Ensure the chat exists and the user has access to it
    // Mask the conflict error as a not found error
    await chatsService.ensureChat({ workspaceId, chatId, principalId }).catch((error) => {
      if (error instanceof DomainErrors.AccessDeniedError) {
        console.error(error);
        throw new DomainErrors.NotFoundError('Chat not found', { id: chatId });
      }
      throw error;
    });

    const history = await chatsService.loadChatMessages({ workspaceId, chatId, principalId });
    let uiMessages = history.map(ChatMessage.toUiMessage<ChronicleMessagePayload>);
    let discardedMessageIds: string[] = [];

    const matchingMessageIndex = history.findIndex((message) => message.id === newMessage.id);
    if (matchingMessageIndex === -1) {
      uiMessages.push(newMessage);
    } else {
      // If the message already exists, we assume the user is re-generating a message.
      // In this case, we need to truncate the conversation messages up to the matching message
      uiMessages = uiMessages.slice(0, matchingMessageIndex + 1);
      discardedMessageIds = history.slice(matchingMessageIndex + 1).map((message) => message.id);
    }

    const modelMessagesParseResult = await parseModelMessages({
      messages: uiMessages,
      tools,
    });

    if (!modelMessagesParseResult.success) {
      throw new DomainErrors.InvalidInputError('Failed to parse model messages.', {
        info: { error: modelMessagesParseResult.reason },
      });
    }

    const modelMessages = modelMessagesParseResult.data.messages;
    const chatMessages = [...history, ChatMessage.fromPayload({ chatId, ...newMessage })];

    return {
      uiMessages,
      chatMessages,
      modelMessages,
      discardedMessageIds,
    };
  };
}
