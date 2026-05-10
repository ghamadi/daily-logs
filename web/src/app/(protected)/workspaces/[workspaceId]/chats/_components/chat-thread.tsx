'use client';

import { useChat } from '@ai-sdk/react';
import { getToolName, isToolUIPart } from 'ai';
import { ArrowUpIcon } from 'lucide-react';
import {
  type ChangeEvent,
  type KeyboardEvent,
  type SubmitEvent,
  useCallback,
  useMemo,
  useState,
} from 'react';

import { Conversation } from '@web/components/ai-elements/conversation';
import { Message } from '@web/components/ai-elements/message';
import { Button } from '@web/components/ui/button';
import { createChatTransport } from '@web/lib/chat/transport';
import type { UiMessagePayload } from '@web/lib/chat/types';

export type ChatThreadProps = {
  workspaceId: string;
  chatId: string;
  initialMessages: UiMessagePayload[];
};

export function ChatThread(props: ChatThreadProps) {
  const { workspaceId, chatId, initialMessages } = props;

  const transport = useMemo(() => createChatTransport({ workspaceId, chatId }), [workspaceId, chatId]);

  const { messages, sendMessage, status, error, stop, clearError } = useChat<UiMessagePayload>({
    id: chatId,
    transport,
    messages: initialMessages,
  });

  const [input, setInput] = useState('');
  const isBusy = status === 'submitted' || status === 'streaming';

  const handleSubmit = useCallback(
    async (event?: SubmitEvent) => {
      event?.preventDefault();
      const text = input.trim();
      if (!text || isBusy) return;

      // Clear the textarea optimistically so the user sees their input was
      // accepted; sendMessage owns appending the message + driving the stream.
      setInput('');
      try {
        await sendMessage({ text });
      } catch (cause) {
        // `useChat` already surfaces this through `error`; we just want to
        // make sure local state stays sane.
        console.error(cause);
      }
    },
    [input, isBusy, sendMessage],
  );

  return (
    <div className="flex size-full flex-col">
      <MessageList messages={messages} />

      {error && (
        <div className="border-destructive/30 bg-destructive/10 text-destructive mx-4 mb-3 flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-xs">
          <span className="line-clamp-2">{error.message}</span>
          <Button size="xs" variant="ghost" onClick={clearError}>
            Dismiss
          </Button>
        </div>
      )}

      <Composer
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        onStop={stop}
        isBusy={isBusy}
      />
    </div>
  );
}

// ------------------------------------------------------------
// Message list
// ------------------------------------------------------------

type MessageListProps = {
  messages: UiMessagePayload[];
};

function MessageList(props: MessageListProps) {
  const { messages } = props;

  return (
    <Conversation className="flex flex-col">
      {!messages.length && <Conversation.EmptyState />}

      {messages.length > 0 && (
        <Conversation.Content>
          <ol className="flex w-full flex-col gap-6">
            {messages.map((message) => (
              <li key={message.id}>
                <Message from={message.role}>
                  <Message.Content>
                    {message.parts.map((part, index) => (
                      <MessagePart key={`${message.id}-${index}`} part={part} />
                    ))}
                  </Message.Content>
                </Message>
              </li>
            ))}
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

// ------------------------------------------------------------
// Composer
// ------------------------------------------------------------

type ComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event?: SubmitEvent<HTMLFormElement>) => void | Promise<void>;
  onStop: () => void;
  isBusy: boolean;
};

function Composer(props: ComposerProps) {
  const { value, onChange, onSubmit, onStop, isBusy } = props;

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends, Shift+Enter inserts a newline. Standard chat ergonomics.
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void onSubmit();
    }
  };

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
  };

  const isEmpty = value.trim().length === 0;

  return (
    <form
      onSubmit={(event) => {
        void onSubmit(event);
      }}
      className="border-border bg-background border-t px-4 py-3"
    >
      <div className="border-border bg-background focus-within:ring-ring/40 mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border p-2 focus-within:ring-2">
        <textarea
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Send a message…"
          className="placeholder:text-muted-foreground max-h-48 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none"
          disabled={false}
        />
        {isBusy ? (
          <Button type="button" size="icon" variant="outline" onClick={onStop}>
            <span className="bg-foreground size-2.5 rounded-sm" aria-hidden />
            <span className="sr-only">Stop generating</span>
          </Button>
        ) : (
          <Button type="submit" size="icon" disabled={isEmpty}>
            <ArrowUpIcon />
            <span className="sr-only">Send message</span>
          </Button>
        )}
      </div>
    </form>
  );
}
