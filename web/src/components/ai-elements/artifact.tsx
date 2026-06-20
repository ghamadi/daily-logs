'use client';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip';
import { cn, composeCompoundComponent } from '@/lib/utils/components';
import type { LucideIcon } from 'lucide-react';
import { XIcon } from 'lucide-react';
import type { ComponentProps } from 'react';

export const Artifact = composeCompoundComponent(ArtifactRoot, {
  Header: ArtifactHeader,
  Close: ArtifactClose,
  Title: ArtifactTitle,
  Description: ArtifactDescription,
  Actions: ArtifactActions,
  Action: ArtifactAction,
  Content: ArtifactContent,
});

// ------------------------------------------------------------
// ArtifactRoot
// ------------------------------------------------------------

export type ArtifactProps = ComponentProps<'div'>;

function ArtifactRoot(props: ArtifactProps) {
  const { className, ...rest } = props;
  return (
    <div
      data-slot="artifact"
      className={cn(
        'flex flex-col overflow-hidden rounded-lg border bg-background shadow-sm',
        className,
      )}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// ArtifactHeader
// ------------------------------------------------------------

export type ArtifactHeaderProps = ComponentProps<'div'>;

function ArtifactHeader(props: ArtifactHeaderProps) {
  const { className, ...rest } = props;
  return (
    <div
      data-slot="artifact-header"
      className={cn('flex items-center justify-between border-b bg-muted/50 px-4 py-3', className)}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// ArtifactClose
// ------------------------------------------------------------

export type ArtifactCloseProps = ComponentProps<typeof Button>;

function ArtifactClose(props: ArtifactCloseProps) {
  const { className, children, size = 'sm', variant = 'ghost', ...rest } = props;
  return (
    <Button
      data-slot="artifact-close"
      className={cn('size-8 p-0 text-muted-foreground hover:text-foreground', className)}
      size={size}
      type="button"
      variant={variant}
      {...rest}
    >
      {children ?? <XIcon className="size-4" />}
      <span className="sr-only">Close</span>
    </Button>
  );
}

// ------------------------------------------------------------
// ArtifactTitle
// ------------------------------------------------------------

export type ArtifactTitleProps = ComponentProps<'p'>;

function ArtifactTitle(props: ArtifactTitleProps) {
  const { className, ...rest } = props;
  return (
    <p
      data-slot="artifact-title"
      className={cn('font-medium text-foreground text-sm', className)}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// ArtifactDescription
// ------------------------------------------------------------

export type ArtifactDescriptionProps = ComponentProps<'p'>;

function ArtifactDescription(props: ArtifactDescriptionProps) {
  const { className, ...rest } = props;
  return (
    <p
      data-slot="artifact-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// ArtifactActions
// ------------------------------------------------------------

export type ArtifactActionsProps = ComponentProps<'div'>;

function ArtifactActions(props: ArtifactActionsProps) {
  const { className, ...rest } = props;
  return (
    <div
      data-slot="artifact-actions"
      className={cn('flex items-center gap-1', className)}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// ArtifactAction
// ------------------------------------------------------------

export type ArtifactActionProps = ComponentProps<typeof Button> & {
  tooltip?: string;
  label?: string;
  icon?: LucideIcon;
};

function ArtifactAction(props: ArtifactActionProps) {
  const { tooltip, label, icon: Icon, children, className, size = 'sm', variant = 'ghost', ...rest } =
    props;

  const button = (
    <Button
      data-slot="artifact-action"
      className={cn('size-8 p-0 text-muted-foreground hover:text-foreground', className)}
      size={size}
      type="button"
      variant={variant}
      {...rest}
    >
      {Icon ? <Icon className="size-4" /> : children}
      <span className="sr-only">{label || tooltip}</span>
    </Button>
  );

  if (tooltip) {
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

  return button;
}

// ------------------------------------------------------------
// ArtifactContent
// ------------------------------------------------------------

export type ArtifactContentProps = ComponentProps<'div'>;

function ArtifactContent(props: ArtifactContentProps) {
  const { className, ...rest } = props;
  return (
    <div
      data-slot="artifact-content"
      className={cn('flex-1 overflow-auto p-4', className)}
      {...rest}
    />
  );
}
