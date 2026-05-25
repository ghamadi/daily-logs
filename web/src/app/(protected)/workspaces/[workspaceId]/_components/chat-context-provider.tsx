'use client';

import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useMemo,
  useState,
} from 'react';

export type ChatContext = {
  initialPrompt?: string;
  setInitialPrompt: Dispatch<SetStateAction<string | undefined>>;
};

const ChatContext = createContext<ChatContext | undefined>(undefined);

export type ChatContextProviderProps = {
  children: ReactNode;
};

export function ChatContextProvider(props: ChatContextProviderProps) {
  const { children } = props;

  const [initialPrompt, setInitialPrompt] = useState<string | undefined>(undefined);

  const contextValue = useMemo(() => ({ initialPrompt, setInitialPrompt }), [initialPrompt]);

  return <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatContextProvider');
  }
  return context;
}
