'use client';

import { useParams } from 'next/navigation';
import { ChatThread } from '@/app/(protected)/workspaces/[workspaceId]/chats/_components/chat-thread';
import { useChatContext } from '@/app/(protected)/workspaces/[workspaceId]/_components/chat-context-provider';
import { useQuery } from '@tanstack/react-query';
import { ChatMessage } from '@domains/chats/entities/chat-message';
import { useEffect, useRef, useState } from 'react';

export default function ChatPage() {
  const params = useParams();
  const { initialPrompt } = useChatContext();
  const [isHistoryQueryEnabled, setIsHistoryQueryEnabled] = useState(false);

  const workspaceId = String(params.workspaceId);
  const chatId = String(params.chatId);

  const initialPromptRef = useRef(initialPrompt);

  useEffect(() => {
    if (!initialPromptRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsHistoryQueryEnabled(true);
    }
  }, [initialPrompt]);

  const historyQuery = useChatHistoryQuery({
    chatId,
    workspaceId,
    enabled: isHistoryQueryEnabled,
  });

  const history = historyQuery.data ?? [];

  if (historyQuery.isLoading) {
    return <div>Loading...</div>;
  }

  if (historyQuery.isError) {
    return <div>Error: {historyQuery.error.message}</div>;
  }

  return (
    <ChatThread
      workspaceId={workspaceId}
      chatId={chatId}
      initialMessages={history.map((entry) => entry.payload)}
    />
  );
}

function useChatHistoryQuery(params: { workspaceId: string; chatId: string; enabled: boolean }) {
  const { workspaceId, chatId, enabled } = params;
  return useQuery({
    enabled,
    queryKey: ['chat-history', workspaceId, chatId],
    queryFn: async () => {
      const response = await fetch(`/api/workspaces/${workspaceId}/chats/${chatId}/messages`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chat history');
      }

      const data = await response.json();
      return data.data as ChatMessage[];
    },
  });
}
