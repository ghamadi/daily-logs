import { DefaultChatTransport } from 'ai';
import type { UiMessagePayload } from '@web/lib/chat/types';
import { SendChatMessageRequestBody } from '@web/app/api/workspaces/[workspaceId]/chats/[chatId]/messages/route';

export type CreateChatTransportInput = {
  workspaceId: string;
  chatId: string;
};

/**
 * Builds the client-side transport `useChat` uses to
 * talk to our streaming chat endpoint.
 */
export function createChatTransport(
  input: CreateChatTransportInput,
): DefaultChatTransport<UiMessagePayload> {
  const { workspaceId, chatId } = input;

  return new DefaultChatTransport<UiMessagePayload>({
    // By default, useChat sends the entire history of messages to the server,
    // so we override the default prepareSendMessagesRequest to send only the latest message instead.
    prepareSendMessagesRequest: ({ messages }) => ({
      api: `/api/workspaces/${workspaceId}/chats/${chatId}/messages`,
      body: { message: messages.at(-1) } satisfies SendChatMessageRequestBody,
    }),
  });
}
