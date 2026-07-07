'use client';

import { useParams } from 'next/navigation';
import { useChatContext } from '@/app/(main)/workspaces/[workspaceId]/_components/chat-context-provider';

import { ChatThread } from '@/app/(main)/workspaces/[workspaceId]/chats/_components/chat-thread';
import { useChatMessagesQuery } from '@/app/(main)/workspaces/[workspaceId]/chats/_hooks/use-chat-messages-query';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function ChatPage() {
  const { initialPrompt } = useChatContext();
  const { workspaceId, chatId } = useParams<{ workspaceId: string; chatId: string }>();

  const messagesQuery = useChatMessagesQuery({
    workspaceId,
    chatId,
    enabled: !initialPrompt,
  });

  if (messagesQuery.isLoading) {
    return <LoadingSpinner fullPage />;
  }

  if (messagesQuery.isError) {
    return <div>Error: {messagesQuery.error.message}</div>;
  }

  return (
    <ChatThread workspaceId={workspaceId} chatId={chatId} initialMessages={messagesQuery.data ?? []} />
  );
}
