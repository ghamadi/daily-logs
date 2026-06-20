'use client';

import { Collapsible } from '@/components/ui/collapsible';
import { cn, composeCompoundComponent } from '@/lib/utils/components';
import { ChevronDownIcon, SearchIcon } from 'lucide-react';
import type { ComponentProps } from 'react';

export const Task = composeCompoundComponent(TaskRoot, {
  Trigger: TaskTrigger,
  Content: TaskContent,
  Item: TaskItem,
  ItemFile: TaskItemFile,
});

// ------------------------------------------------------------
// TaskRoot
// ------------------------------------------------------------

export type TaskProps = ComponentProps<typeof Collapsible>;

function TaskRoot(props: TaskProps) {
  const { defaultOpen = true, className, ...rest } = props;
  return (
    <Collapsible data-slot="task" className={cn(className)} defaultOpen={defaultOpen} {...rest} />
  );
}

// ------------------------------------------------------------
// TaskTrigger
// ------------------------------------------------------------

export type TaskTriggerProps = ComponentProps<typeof Collapsible.Trigger> & {
  title: string;
};

function TaskTrigger(props: TaskTriggerProps) {
  const { children, className, title, ...rest } = props;
  return (
    <Collapsible.Trigger asChild className={cn('group', className)} data-slot="task-trigger" {...rest}>
      {children ?? (
        <div className="flex w-full cursor-pointer items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground">
          <SearchIcon className="size-4" />
          <p className="text-sm">{title}</p>
          <ChevronDownIcon className="size-4 transition-transform group-data-[state=open]:rotate-180" />
        </div>
      )}
    </Collapsible.Trigger>
  );
}

// ------------------------------------------------------------
// TaskContent
// ------------------------------------------------------------

export type TaskContentProps = ComponentProps<typeof Collapsible.Content>;

function TaskContent(props: TaskContentProps) {
  const { children, className, ...rest } = props;
  return (
    <Collapsible.Content
      data-slot="task-content"
      className={cn(
        'data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in',
        className,
      )}
      {...rest}
    >
      <div className="mt-4 space-y-2 border-muted border-l-2 pl-4">{children}</div>
    </Collapsible.Content>
  );
}

// ------------------------------------------------------------
// TaskItem
// ------------------------------------------------------------

export type TaskItemProps = ComponentProps<'div'>;

function TaskItem(props: TaskItemProps) {
  const { children, className, ...rest } = props;
  return (
    <div data-slot="task-item" className={cn('text-muted-foreground text-sm', className)} {...rest}>
      {children}
    </div>
  );
}

// ------------------------------------------------------------
// TaskItemFile
// ------------------------------------------------------------

export type TaskItemFileProps = ComponentProps<'div'>;

function TaskItemFile(props: TaskItemFileProps) {
  const { children, className, ...rest } = props;
  return (
    <div
      data-slot="task-item-file"
      className={cn(
        'inline-flex items-center gap-1 rounded-md border bg-secondary px-1.5 py-0.5 text-foreground text-xs',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
