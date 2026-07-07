'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn, composeCompoundComponent } from '@/lib/utils/components';
import type { ComponentProps } from 'react';
import { useCallback } from 'react';

export const Suggestions = composeCompoundComponent(SuggestionsRoot, {
  Item: SuggestionItem,
});

// ------------------------------------------------------------
// SuggestionsRoot
// ------------------------------------------------------------

export type SuggestionsProps = ComponentProps<typeof ScrollArea>;

function SuggestionsRoot(props: SuggestionsProps) {
  const { className, children, ...rest } = props;
  return (
    <ScrollArea data-slot="suggestions" className="w-full overflow-x-auto whitespace-nowrap" {...rest}>
      <div className={cn('flex w-max flex-nowrap items-center gap-2', className)}>
        {children}
      </div>
      <ScrollArea.Scrollbar className="hidden" orientation="horizontal" />
    </ScrollArea>
  );
}

// ------------------------------------------------------------
// SuggestionItem
// ------------------------------------------------------------

export type SuggestionItemProps = Omit<ComponentProps<typeof Button>, 'onClick'> & {
  suggestion: string;
  onClick?: (suggestion: string) => void;
};

function SuggestionItem(props: SuggestionItemProps) {
  const { suggestion, onClick, className, variant = 'outline', size = 'sm', children, ...rest } = props;

  const handleClick = useCallback(() => {
    onClick?.(suggestion);
  }, [onClick, suggestion]);

  return (
    <Button
      data-slot="suggestion-item"
      className={cn('cursor-pointer rounded-full px-4', className)}
      onClick={handleClick}
      size={size}
      type="button"
      variant={variant}
      {...rest}
    >
      {children || suggestion}
    </Button>
  );
}
