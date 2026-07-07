import { ReactNode } from 'react';
import { ChatContextProvider } from '@/app/(main)/workspaces/[workspaceId]/_components/chat-context-provider';

export default function ChatLayout(props: { children: ReactNode }) {
  return <ChatContextProvider>{props.children}</ChatContextProvider>;
}
