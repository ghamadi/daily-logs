'use client';

import { v7 as uuidv7 } from 'uuid';
import { useChat } from '@ai-sdk/react';
import { getToolName, isToolUIPart } from 'ai';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { Conversation } from '@/components/ai-elements/conversation';
import { Message } from '@/components/ai-elements/message';
import { Button } from '@/components/ui/button';
import { createChatTransport } from '@/lib/ai-sdk/transport';
import type { UiMessagePayload } from '@/lib/ai-sdk/types';
import { PromptComposer } from '@/app/(protected)/workspaces/[workspaceId]/chats/_components/prompt-composer';
import { useChatContext } from '@/app/(protected)/workspaces/[workspaceId]/_components/chat-context-provider';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export type ChatThreadProps = {
  workspaceId: string;
  chatId: string;
  initialMessages: UiMessagePayload[];
};

export function ChatThread(props: ChatThreadProps) {
  const { workspaceId, chatId, initialMessages } = props;

  const transport = useMemo(() => createChatTransport({ workspaceId, chatId }), [workspaceId, chatId]);

  const { initialPrompt, setInitialPrompt } = useChatContext();
  const initialPromptRef = useRef(initialPrompt);

  const { messages, sendMessage, status, error, stop, clearError } = useChat<UiMessagePayload>({
    id: chatId,
    transport,
    messages: initialMessages,
    generateId: uuidv7,
  });

  // Send the initial prompt immediately after mounting if it exists
  // This will create a new chat and then append the new message to it
  useEffect(() => {
    if (initialPromptRef.current) {
      sendMessage({ text: initialPromptRef.current });
      initialPromptRef.current = undefined;
    }
  }, [sendMessage, setInitialPrompt]);

  const isBusy = status === 'submitted' || status === 'streaming';

  const handleSubmit = useCallback(
    async (message: string) => {
      try {
        const text = message.trim();
        if (!text || isBusy) {
          return;
        }
        await sendMessage({ text });
      } catch (cause) {
        // `useChat` already surfaces this through `error`; we just want to
        // make sure local state stays sane.
        console.error(cause);
      }
    },
    [isBusy, sendMessage],
  );

  return (
    <div className="mx-auto flex size-full w-full max-w-4xl flex-col px-6 py-8">
      <MessageList messages={messages} loading={status === 'submitted'} />

      {error && (
        <div className="border-destructive/30 bg-destructive/10 text-destructive mx-4 mb-3 flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-xs">
          <span className="line-clamp-2">{error.message}</span>
          <Button size="xs" variant="ghost" onClick={clearError}>
            Dismiss
          </Button>
        </div>
      )}

      <PromptComposer onSubmit={handleSubmit} onStop={stop} isBusy={isBusy} />
    </div>
  );
}

// ------------------------------------------------------------
// Message list
// ------------------------------------------------------------

type MessageListProps = {
  messages: UiMessagePayload[];
  loading: boolean;
};

function MessageList(props: MessageListProps) {
  const { messages, loading } = props;

  const messagesToRender = useMemo(() => {
    const loadingMessage: UiMessagePayload = {
      id: 'loading',
      role: 'assistant',
      parts: [{ type: 'text', text: 'Thinking...' }],
    };

    if (!messages.length) {
      return [];
    }

    if (loading) {
      return [...messages, loadingMessage];
    }

    return [...messages];
  }, [messages, loading]);

  return (
    <Conversation className="flex flex-col">
      {!messagesToRender.length && <Conversation.EmptyState />}

      {messagesToRender.length > 0 && (
        <Conversation.Content>
          <ol className="flex w-full flex-col gap-6">
            {messagesToRender.map((message, index) => {
              const isLoadingMessage = index === messagesToRender.length - 1 && loading;
              return (
                <li key={message.id}>
                  <Message from={message.role}>
                    <Message.Content>
                      {isLoadingMessage ? (
                        <div className="ps-4">
                          <LoadingSpinner className="size-4" />
                        </div>
                      ) : (
                        <>
                          {message.parts.map((part, index) => (
                            <MessagePart key={`${message.id}-${index}`} part={part} />
                          ))}
                        </>
                      )}
                    </Message.Content>
                  </Message>
                </li>
              );
            })}
          </ol>
        </Conversation.Content>
      )}

      <Conversation.ScrollButton />
    </Conversation>
  );
}

// ------------------------------------------------------------
// Message parts
// ------------------------------------------------------------

type MessagePartProps = {
  part: UiMessagePayload['parts'][number];
};

function MessagePart({ part }: MessagePartProps) {
  if (part.type === 'text') {
    return <Message.Response>{part.text}</Message.Response>;
  }

  if (part.type === 'reasoning') {
    return (
      <details className="bg-background/40 rounded-md border border-current/10 px-2 py-1 text-xs opacity-80">
        <summary className="cursor-pointer select-none">Reasoning</summary>
        <p className="mt-1 wrap-break-word whitespace-pre-wrap">{part.text}</p>
      </details>
    );
  }

  if (part.type === 'step-start') {
    // Boundary between tool-loop steps; rendering one is noisy.
    return null;
  }

  if (isToolUIPart(part)) {
    return <ToolInvocation part={part} />;
  }

  return null;
}

type ToolInvocationProps = {
  part: Extract<
    UiMessagePayload['parts'][number],
    { type: `tool-${string}` } | { type: 'dynamic-tool' }
  >;
};

function ToolInvocation({ part }: ToolInvocationProps) {
  const name = getToolName(part);

  return (
    <div className="bg-background/40 rounded-md border border-current/10 px-2 py-1.5 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono font-medium">tool · {name}</span>
        <span className="text-muted-foreground tracking-wide uppercase">{part.state}</span>
      </div>
      {part.state === 'input-streaming' || part.state === 'input-available' ? (
        <PreBlock label="input" value={part.input} />
      ) : null}
      {part.state === 'output-available' ? (
        <>
          <PreBlock label="input" value={part.input} />
          <PreBlock label="output" value={part.output} />
        </>
      ) : null}
      {part.state === 'output-error' ? (
        <>
          <PreBlock label="input" value={part.input} />
          <p className="text-destructive mt-1 wrap-break-word">Error: {part.errorText}</p>
        </>
      ) : null}
    </div>
  );
}

function PreBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="mt-1.5">
      <span className="text-muted-foreground text-[10px] tracking-wide uppercase">{label}</span>
      <pre className="bg-background/60 mt-0.5 max-h-40 overflow-auto rounded p-2 text-[11px] leading-snug">
        {safeStringify(value)}
      </pre>
    </div>
  );
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
