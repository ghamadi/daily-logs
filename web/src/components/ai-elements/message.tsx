'use client';

import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip';
import { cn, composeCompoundComponent } from '@/lib/utils/components';
import { cjk } from '@streamdown/cjk';
import { code } from '@streamdown/code';
import { math } from '@streamdown/math';
import { mermaid } from '@streamdown/mermaid';
import type { UIMessage } from 'ai';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import type { ComponentProps, HTMLAttributes, ReactElement } from 'react';
import { createContext, memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Streamdown } from 'streamdown';

export const Message = composeCompoundComponent(MessageRoot, {
  Content: MessageContent,
  Actions: MessageActions,
  Action: MessageAction,
  Toolbar: MessageToolbar,
  Response: memo(
    MessageResponse,
    (prev, next) => prev.children === next.children && next.isAnimating === prev.isAnimating,
  ),
  Branch: MessageBranch,
  BranchContent: MessageBranchContent,
  BranchSelector: MessageBranchSelector,
  BranchPrevious: MessageBranchPrevious,
  BranchNext: MessageBranchNext,
  BranchPage: MessageBranchPage,
});

// ------------------------------------------------------------
// MessageRoot
// ------------------------------------------------------------
export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage['role'];
};

function MessageRoot(props: MessageProps) {
  const { className, from, ...rest } = props;
  return (
    <div
      className={cn(
        'group flex w-full max-w-[95%] flex-col gap-2',
        from === 'user' ? 'is-user ml-auto justify-end' : 'is-assistant',
        className,
      )}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// MessageContent
// ------------------------------------------------------------
export type MessageContentProps = HTMLAttributes<HTMLDivElement>;

function MessageContent(props: MessageContentProps) {
  const { className, ...rest } = props;
  return (
    <div
      className={cn(
        'is-user:dark flex w-fit max-w-full min-w-0 flex-col gap-2 overflow-hidden text-sm',
        'group-[.is-user]:bg-secondary group-[.is-user]:text-foreground group-[.is-user]:ml-auto group-[.is-user]:rounded-lg group-[.is-user]:px-4 group-[.is-user]:py-3',
        'group-[.is-assistant]:text-foreground',
        className,
      )}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// MessageActions
// ------------------------------------------------------------
export type MessageActionsProps = ComponentProps<'div'>;

function MessageActions(props: MessageActionsProps) {
  const { className, ...rest } = props;
  return <div className={cn('flex items-center gap-1', className)} {...rest} />;
}

// ------------------------------------------------------------
// MessageAction
// ------------------------------------------------------------
export type MessageActionProps = ComponentProps<typeof Button> & {
  tooltip?: string;
  label?: string;
};

function MessageAction(props: MessageActionProps) {
  const { tooltip, children, label, variant = 'ghost', size = 'icon-sm', ...rest } = props;

  const button = (
    <Button size={size} type="button" variant={variant} {...rest}>
      {children}
      <span className="sr-only">{label || tooltip}</span>
    </Button>
  );

  if (!tooltip) {
    return button;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <Tooltip.Trigger asChild>{button}</Tooltip.Trigger>
        <Tooltip.Content>
          <p>{tooltip}</p>
        </Tooltip.Content>
      </Tooltip>
    </TooltipProvider>
  );
}

// ------------------------------------------------------------
// MessageBranch context
// ------------------------------------------------------------
interface MessageBranchContextType {
  currentBranch: number;
  totalBranches: number;
  goToPrevious: () => void;
  goToNext: () => void;
  branches: ReactElement[];
  setBranches: (branches: ReactElement[]) => void;
}

const MessageBranchContext = createContext<MessageBranchContextType | null>(null);

function useMessageBranch() {
  const context = useContext(MessageBranchContext);

  if (!context) {
    throw new Error('MessageBranch components must be used within MessageBranch');
  }

  return context;
}

// ------------------------------------------------------------
// MessageBranchRoot
// ------------------------------------------------------------
export type MessageBranchProps = HTMLAttributes<HTMLDivElement> & {
  defaultBranch?: number;
  onBranchChange?: (branchIndex: number) => void;
};

function MessageBranch(props: MessageBranchProps) {
  const { defaultBranch = 0, onBranchChange, className, ...rest } = props;

  const [currentBranch, setCurrentBranch] = useState(defaultBranch);
  const [branches, setBranches] = useState<ReactElement[]>([]);

  const handleBranchChange = useCallback(
    (newBranch: number) => {
      setCurrentBranch(newBranch);
      onBranchChange?.(newBranch);
    },
    [onBranchChange],
  );

  const goToPrevious = useCallback(() => {
    const newBranch = currentBranch > 0 ? currentBranch - 1 : branches.length - 1;
    handleBranchChange(newBranch);
  }, [currentBranch, branches.length, handleBranchChange]);

  const goToNext = useCallback(() => {
    const newBranch = currentBranch < branches.length - 1 ? currentBranch + 1 : 0;
    handleBranchChange(newBranch);
  }, [currentBranch, branches.length, handleBranchChange]);

  const contextValue = useMemo<MessageBranchContextType>(
    () => ({
      branches,
      currentBranch,
      goToNext,
      goToPrevious,
      setBranches,
      totalBranches: branches.length,
    }),
    [branches, currentBranch, goToNext, goToPrevious],
  );

  return (
    <MessageBranchContext.Provider value={contextValue}>
      <div className={cn('grid w-full gap-2 [&>div]:pb-0', className)} {...rest} />
    </MessageBranchContext.Provider>
  );
}

// ------------------------------------------------------------
// MessageBranchContent
// ------------------------------------------------------------
export type MessageBranchContentProps = HTMLAttributes<HTMLDivElement>;

function MessageBranchContent(props: MessageBranchContentProps) {
  const { children, ...rest } = props;
  const { currentBranch, setBranches, branches } = useMessageBranch();
  const childrenArray = useMemo(() => (Array.isArray(children) ? children : [children]), [children]);

  // Use useEffect to update branches when they change
  useEffect(() => {
    if (branches.length !== childrenArray.length) {
      setBranches(childrenArray);
    }
  }, [childrenArray, branches, setBranches]);

  return childrenArray.map((branch, index) => (
    <div
      className={cn(
        'grid gap-2 overflow-hidden [&>div]:pb-0',
        index === currentBranch ? 'block' : 'hidden',
      )}
      key={branch.key}
      {...rest}
    >
      {branch}
    </div>
  ));
}

// ------------------------------------------------------------
// MessageBranchSelector
// ------------------------------------------------------------
export type MessageBranchSelectorProps = ComponentProps<typeof ButtonGroup>;

function MessageBranchSelector(props: MessageBranchSelectorProps) {
  const { className, ...rest } = props;
  const { totalBranches } = useMessageBranch();

  // Don't render if there's only one branch
  if (totalBranches <= 1) {
    return null;
  }

  return (
    <ButtonGroup
      className={cn(
        '[&>*:not(:first-child)]:rounded-l-md [&>*:not(:last-child)]:rounded-r-md',
        className,
      )}
      orientation="horizontal"
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// MessageBranchPrevious
// ------------------------------------------------------------
export type MessageBranchPreviousProps = ComponentProps<typeof Button>;

function MessageBranchPrevious(props: MessageBranchPreviousProps) {
  const { children, ...rest } = props;
  const { goToPrevious, totalBranches } = useMessageBranch();

  return (
    <Button
      aria-label="Previous branch"
      disabled={totalBranches <= 1}
      onClick={goToPrevious}
      size="icon-sm"
      type="button"
      variant="ghost"
      {...rest}
    >
      {children ?? <ChevronLeftIcon size={14} />}
    </Button>
  );
}

// ------------------------------------------------------------
// MessageBranchNext
// ------------------------------------------------------------
export type MessageBranchNextProps = ComponentProps<typeof Button>;

function MessageBranchNext(props: MessageBranchNextProps) {
  const { children, ...rest } = props;
  const { goToNext, totalBranches } = useMessageBranch();

  return (
    <Button
      aria-label="Next branch"
      disabled={totalBranches <= 1}
      onClick={goToNext}
      size="icon-sm"
      type="button"
      variant="ghost"
      {...rest}
    >
      {children ?? <ChevronRightIcon size={14} />}
    </Button>
  );
}

// ------------------------------------------------------------
// MessageBranchPage
// ------------------------------------------------------------
export type MessageBranchPageProps = HTMLAttributes<HTMLSpanElement>;

function MessageBranchPage(props: MessageBranchPageProps) {
  const { className, ...rest } = props;
  const { currentBranch, totalBranches } = useMessageBranch();

  return (
    <ButtonGroup.Text
      className={cn('text-muted-foreground border-none bg-transparent shadow-none', className)}
      {...rest}
    >
      {currentBranch + 1} of {totalBranches}
    </ButtonGroup.Text>
  );
}

// ------------------------------------------------------------
// MessageResponse
// ------------------------------------------------------------
export type MessageResponseProps = ComponentProps<typeof Streamdown>;

const streamdownPlugins = { cjk, code, math, mermaid };

function MessageResponse(props: MessageResponseProps) {
  const { className, ...rest } = props;
  return (
    <Streamdown
      className={cn('size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0', className)}
      plugins={streamdownPlugins}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// MessageToolbar
// ------------------------------------------------------------
export type MessageToolbarProps = ComponentProps<'div'>;

function MessageToolbar(props: MessageToolbarProps) {
  const { className, ...rest } = props;
  return (
    <div className={cn('mt-4 flex w-full items-center justify-between gap-4', className)} {...rest} />
  );
}
