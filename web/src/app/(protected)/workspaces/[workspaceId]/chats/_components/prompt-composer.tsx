'use client';

import { Button } from '@/components/ui/button';
import { ArrowUpIcon } from 'lucide-react';
import { type KeyboardEvent, type SubmitEvent, type ChangeEvent, useState } from 'react';

type PromptComposerProps = {
  onSubmit: (message: string) => void | Promise<void>;
  onStop: () => void;
  isBusy: boolean;
};

export function PromptComposer(props: PromptComposerProps) {
  const { onSubmit, onStop, isBusy } = props;
  const [value, setValue] = useState('');

  const isEmpty = !value.trim();

  const handleSubmit = (text: string) => {
    onSubmit(text);
    setValue('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends, Shift+Enter inserts a newline. Standard chat ergonomics.
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      handleSubmit(value);
    }
  };

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(event.target.value);
  };

  const handleFormSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isEmpty || isBusy) {
      return;
    }
    handleSubmit(value.trim());
  };

  return (
    <form onSubmit={handleFormSubmit} className="border-border bg-background w-full">
      <div className="border-border bg-background focus-within:ring-ring/40 mx-auto flex items-end gap-2 rounded-2xl border p-2 focus-within:ring-2">
        <textarea
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={3}
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
          <Button type="submit" size="icon" disabled={isEmpty || isBusy}>
            <ArrowUpIcon />
            <span className="sr-only">Send message</span>
          </Button>
        )}
      </div>
    </form>
  );
}
