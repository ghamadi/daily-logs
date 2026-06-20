'use client';

import { Badge } from '@/components/ui/badge';
import { Collapsible } from '@/components/ui/collapsible';
import { cn, composeCompoundComponent } from '@/lib/utils/components';
import type { DynamicToolUIPart, ToolUIPart } from 'ai';
import {
  CheckCircleIcon,
  ChevronDownIcon,
  CircleIcon,
  ClockIcon,
  WrenchIcon,
  XCircleIcon,
} from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { isValidElement } from 'react';
import { CodeBlock } from './code-block';

export const Tool = composeCompoundComponent(ToolRoot, {
  Header: ToolHeader,
  Content: ToolContent,
  Input: ToolInput,
  Output: ToolOutput,
});

export type ToolPart = ToolUIPart | DynamicToolUIPart;

// ------------------------------------------------------------
// ToolRoot
// ------------------------------------------------------------

export type ToolProps = ComponentProps<typeof Collapsible>;

function ToolRoot(props: ToolProps) {
  const { className, ...rest } = props;
  return (
    <Collapsible
      data-slot="tool"
      className={cn('group not-prose mb-4 w-full rounded-md border', className)}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// ToolHeader
// ------------------------------------------------------------

export type ToolHeaderProps = {
  title?: string;
  className?: string;
} & (
  | { type: ToolUIPart['type']; state: ToolUIPart['state']; toolName?: never }
  | {
      type: DynamicToolUIPart['type'];
      state: DynamicToolUIPart['state'];
      toolName: string;
    }
);

function ToolHeader(props: ToolHeaderProps) {
  const { className, title, type, state, toolName, ...rest } = props;

  const derivedName = type === 'dynamic-tool' ? toolName : type.split('-').slice(1).join('-');

  return (
    <Collapsible.Trigger
      data-slot="tool-header"
      className={cn('flex w-full items-center justify-between gap-4 p-3', className)}
      {...rest}
    >
      <div className="flex items-center gap-2">
        <WrenchIcon className="size-4 text-muted-foreground" />
        <span className="font-medium text-sm">{title ?? derivedName}</span>
        {getStatusBadge(state)}
      </div>
      <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
    </Collapsible.Trigger>
  );
}

// ------------------------------------------------------------
// ToolContent
// ------------------------------------------------------------

export type ToolContentProps = ComponentProps<typeof Collapsible.Content>;

function ToolContent(props: ToolContentProps) {
  const { className, ...rest } = props;
  return (
    <Collapsible.Content
      data-slot="tool-content"
      className={cn(
        'data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 space-y-4 p-4 text-popover-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in',
        className,
      )}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// ToolInput
// ------------------------------------------------------------

export type ToolInputProps = ComponentProps<'div'> & {
  input: ToolPart['input'];
};

function ToolInput(props: ToolInputProps) {
  const { className, input, ...rest } = props;
  return (
    <div data-slot="tool-input" className={cn('space-y-2 overflow-hidden', className)} {...rest}>
      <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        Parameters
      </h4>
      <div className="rounded-md bg-muted/50">
        <CodeBlock code={JSON.stringify(input, null, 2)} language="json" />
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// ToolOutput
// ------------------------------------------------------------

export type ToolOutputProps = ComponentProps<'div'> & {
  output: ToolPart['output'];
  errorText: ToolPart['errorText'];
};

function ToolOutput(props: ToolOutputProps) {
  const { className, output, errorText, ...rest } = props;

  if (!(output || errorText)) {
    return null;
  }

  let Output = <div>{output as ReactNode}</div>;

  if (typeof output === 'object' && !isValidElement(output)) {
    Output = <CodeBlock code={JSON.stringify(output, null, 2)} language="json" />;
  } else if (typeof output === 'string') {
    Output = <CodeBlock code={output} language="json" />;
  }

  return (
    <div data-slot="tool-output" className={cn('space-y-2', className)} {...rest}>
      <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        {errorText ? 'Error' : 'Result'}
      </h4>
      <div
        className={cn(
          'overflow-x-auto rounded-md text-xs [&_table]:w-full',
          errorText ? 'bg-destructive/10 text-destructive' : 'bg-muted/50 text-foreground',
        )}
      >
        {errorText && <div>{errorText}</div>}
        {Output}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Helper functions
// ------------------------------------------------------------

const statusLabels: Record<ToolPart['state'], string> = {
  'approval-requested': 'Awaiting Approval',
  'approval-responded': 'Responded',
  'input-available': 'Running',
  'input-streaming': 'Pending',
  'output-available': 'Completed',
  'output-denied': 'Denied',
  'output-error': 'Error',
};

const statusIcons: Record<ToolPart['state'], ReactNode> = {
  'approval-requested': <ClockIcon className="size-4 text-yellow-600" />,
  'approval-responded': <CheckCircleIcon className="size-4 text-blue-600" />,
  'input-available': <ClockIcon className="size-4 animate-pulse" />,
  'input-streaming': <CircleIcon className="size-4" />,
  'output-available': <CheckCircleIcon className="size-4 text-green-600" />,
  'output-denied': <XCircleIcon className="size-4 text-orange-600" />,
  'output-error': <XCircleIcon className="size-4 text-red-600" />,
};

function getStatusBadge(status: ToolPart['state']) {
  return (
    <Badge className="gap-1.5 rounded-full text-xs" variant="secondary">
      {statusIcons[status]}
      {statusLabels[status]}
    </Badge>
  );
}
