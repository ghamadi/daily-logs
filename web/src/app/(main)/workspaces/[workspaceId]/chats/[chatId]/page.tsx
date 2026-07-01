'use client';

import { useParams } from 'next/navigation';
import { useChatContext } from '@/app/(main)/workspaces/[workspaceId]/_components/chat-context-provider';

import { ChatThread } from '@/app/(main)/workspaces/[workspaceId]/chats/_components/chat-thread';

export default function ChatPage() {
  const { initialPrompt } = useChatContext();
  const { workspaceId, chatId } = useParams<{ workspaceId: string; chatId: string }>();

  if (!initialPrompt) {
    return <div>Loading existing chats is not yet supported</div>;
  }

  return <ChatThread workspaceId={workspaceId} chatId={chatId} initialMessages={[]} />;
}
