import { ChatMessage } from '@daily-logs/domains/chats';
import { ChronicleMessagePayload } from '@/lib/ai-sdk/chronicle/types';
import { apiFetch } from '@/lib/api/client';
import { useQuery } from '@tanstack/react-query';

export type UseChatMessagesQueryParams = {
  workspaceId: string;
  chatId: string;
  enabled: boolean;
};

export function useChatMessagesQuery(params: UseChatMessagesQueryParams) {
  const { workspaceId, chatId, enabled } = params;

  return useQuery({
    enabled,
    queryKey: ['chat-messages', workspaceId, chatId],
    queryFn: async () => {
      const response = await apiFetch<ChatMessage[]>(
        `/api/workspaces/${workspaceId}/chats/${chatId}/messages`,
      );
      return response.data.map(ChatMessage.toUiMessage<ChronicleMessagePayload>);
    },
  });
}
