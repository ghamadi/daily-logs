import { ReactNode } from 'react';
import { ChatContextProvider } from '../_components/chat-context-provider';

export default function ChatLayout(props: { children: ReactNode }) {
  return <ChatContextProvider>{props.children}</ChatContextProvider>;
}
