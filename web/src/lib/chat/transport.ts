import { DefaultChatTransport } from 'ai';
import type { ChatMessagePayload } from '@web/lib/chat/types';

export type CreateChatTransportInput = {
  workspaceId: string;
  chatId: string;
};

/**
 * Builds the client-side transport `useChat` uses to talk to our streaming
 * chat endpoint.
 *
 * The server contract (see `web/src/app/api/workspaces/[workspaceId]/chats/[chatId]/messages/route.ts`)
 * expects a body of `{ message: UIMessage }` — only the latest message — and
 * rebuilds history from the database. The default `DefaultChatTransport` body
 * is `{ id, messages, ... }`, so the override below is mandatory; without it
 * the server returns 400.
 */
export function createChatTransport(
  input: CreateChatTransportInput,
): DefaultChatTransport<ChatMessagePayload> {
  const { workspaceId, chatId } = input;

  return new DefaultChatTransport<ChatMessagePayload>({
    api: `/api/workspaces/${workspaceId}/chats/${chatId}/messages`,
    prepareSendMessagesRequest: ({ messages }) => ({
      body: { message: messages.at(-1) },
    }),
  });
}
