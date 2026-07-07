import { ChatStatus } from 'ai';
import { type ChangeEvent, type RefObject, useCallback, useMemo } from 'react';

import {
  PromptInput,
  PromptInputMessage,
  PromptInputProvider,
} from '@/components/ai-elements/prompt-input';

export type PromptComposerProps = {
  ref?: RefObject<HTMLTextAreaElement>;
  status?: ChatStatus;
  submitDisabled?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
  onStop?: () => void;
  onSubmit?: (message: PromptInputMessage) => Promise<void> | void;
};

export function PromptComposer(props: PromptComposerProps) {
  const { ref, status, submitDisabled, value, onValueChange, onStop, onSubmit } = props;

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      onValueChange?.(event.target.value);
    },
    [onValueChange],
  );

  const handleSubmit = useCallback(
    async (message: PromptInputMessage) => {
      onSubmit?.(message);
      onValueChange?.('');
    },
    [onSubmit, onValueChange],
  );

  const isSubmitDisabled = useMemo(() => {
    if (submitDisabled) {
      return true;
    }
    if (status === 'submitted') {
      return true;
    }
    if (status === 'streaming' && !onStop) {
      return true;
    }
    if (status !== 'streaming' && !onSubmit) {
      return true;
    }
    if (status === 'ready' && !value?.trim()) {
      return true;
    }
    return false;
  }, [submitDisabled, status, onStop, value, onSubmit]);

  return (
    <PromptInputProvider>
      <PromptInput onSubmit={handleSubmit} className="max-w-4xl rounded-lg bg-white">
        <PromptInput.Body>
          <PromptInput.Textarea ref={ref} value={value} onChange={handleChange} />
        </PromptInput.Body>
        <PromptInput.Footer>
          <PromptInput.Tools>{/* TODO: Add tools here */}</PromptInput.Tools>

          <PromptInput.Submit
            className="size-9 min-h-0"
            status={status}
            onStop={onStop}
            disabled={isSubmitDisabled}
          />
        </PromptInput.Footer>
      </PromptInput>
    </PromptInputProvider>
  );
}
