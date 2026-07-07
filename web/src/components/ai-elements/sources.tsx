'use client';

import { Collapsible } from '@/components/ui/collapsible';
import { cn, composeCompoundComponent } from '@/lib/utils/components';
import { BookIcon, ChevronDownIcon } from 'lucide-react';
import type { ComponentProps } from 'react';

export const Sources = composeCompoundComponent(SourcesRoot, {
  Trigger: SourcesTrigger,
  Content: SourcesContent,
});

// ------------------------------------------------------------
// SourcesRoot
// ------------------------------------------------------------

export type SourcesProps = ComponentProps<typeof Collapsible>;

function SourcesRoot(props: SourcesProps) {
  const { className, ...rest } = props;
  return (
    <Collapsible
      data-slot="sources"
      className={cn('not-prose mb-4 text-primary text-xs', className)}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// SourcesTrigger
// ------------------------------------------------------------

export type SourcesTriggerProps = ComponentProps<typeof Collapsible.Trigger> & {
  count: number;
};

function SourcesTrigger(props: SourcesTriggerProps) {
  const { className, count, children, ...rest } = props;
  return (
    <Collapsible.Trigger
      data-slot="sources-trigger"
      className={cn('flex items-center gap-2', className)}
      {...rest}
    >
      {children ?? (
        <>
          <p className="font-medium">Used {count} sources</p>
          <ChevronDownIcon className="h-4 w-4" />
        </>
      )}
    </Collapsible.Trigger>
  );
}

// ------------------------------------------------------------
// SourcesContent
// ------------------------------------------------------------

export type SourcesContentProps = ComponentProps<typeof Collapsible.Content>;

function SourcesContent(props: SourcesContentProps) {
  const { className, ...rest } = props;
  return (
    <Collapsible.Content
      data-slot="sources-content"
      className={cn(
        'mt-3 flex w-fit flex-col gap-2',
        'data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 outline-none data-[state=closed]:animate-out data-[state=open]:animate-in',
        className,
      )}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// Source
// ------------------------------------------------------------

export type SourceProps = ComponentProps<'a'>;

export function Source(props: SourceProps) {
  const { href, title, children, ...rest } = props;
  return (
    <a
      data-slot="source"
      className="flex items-center gap-2"
      href={href}
      rel="noreferrer"
      target="_blank"
      {...rest}
    >
      {children ?? (
        <>
          <BookIcon className="h-4 w-4" />
          <span className="block font-medium">{title}</span>
        </>
      )}
    </a>
  );
}
