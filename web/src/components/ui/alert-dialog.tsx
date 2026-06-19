'use client';

import type { ComponentProps } from 'react';
import { AlertDialog as AlertDialogPrimitive } from 'radix-ui';
import { cn, composeCompoundComponent } from '@/lib/utils/components';
import { Button } from '@/components/ui/button';
import { useLayer } from '@/hooks/use-layer';

export const AlertDialog = composeCompoundComponent(AlertDialogRoot, {
  Trigger: AlertDialogTrigger,
  Portal: AlertDialogPortal,
  Overlay: AlertDialogOverlay,
  Content: AlertDialogContent,
  Header: AlertDialogHeader,
  Footer: AlertDialogFooter,
  Media: AlertDialogMedia,
  Title: AlertDialogTitle,
  Description: AlertDialogDescription,
  Action: AlertDialogAction,
  Cancel: AlertDialogCancel,
});

// ------------------------------------------------------------
// AlertDialogRoot
// ------------------------------------------------------------

export type AlertDialogProps = ComponentProps<typeof AlertDialogPrimitive.Root>;

function AlertDialogRoot(props: AlertDialogProps) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

// ------------------------------------------------------------
// AlertDialogTrigger
// ------------------------------------------------------------

export type AlertDialogTriggerProps = ComponentProps<typeof AlertDialogPrimitive.Trigger>;

function AlertDialogTrigger(props: AlertDialogTriggerProps) {
  return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />;
}

// ------------------------------------------------------------
// AlertDialogPortal
// ------------------------------------------------------------

export type AlertDialogPortalProps = ComponentProps<typeof AlertDialogPrimitive.Portal>;

function AlertDialogPortal(props: AlertDialogPortalProps) {
  return <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />;
}

// ------------------------------------------------------------
// AlertDialogOverlay
// ------------------------------------------------------------

export type AlertDialogOverlayProps = ComponentProps<typeof AlertDialogPrimitive.Overlay>;

function AlertDialogOverlay(props: AlertDialogOverlayProps) {
  const { className, ...rest } = props;
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(
        'data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 fixed inset-0 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs',
        className,
      )}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// AlertDialogContent
// ------------------------------------------------------------

export type AlertDialogContentProps = ComponentProps<typeof AlertDialogPrimitive.Content> & {
  size?: 'default' | 'sm';
  portal?: AlertDialogPortalProps;
};

function AlertDialogContent(props: AlertDialogContentProps) {
  const { className, size = 'default', portal, style, ...rest } = props;
  const { container, ...portalProps } = portal ?? {};

  const interactiveLayer = useLayer('interactive');

  return (
    <AlertDialogPortal container={container ?? interactiveLayer.container} {...portalProps}>
      <AlertDialogOverlay style={{ zIndex: interactiveLayer.zIndex }} />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        data-size={size}
        style={{ zIndex: interactiveLayer.zIndex, ...style }}
        className={cn(
          'group/alert-dialog-content bg-popover text-popover-foreground ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 fixed top-1/2 left-1/2 grid w-full -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl p-4 ring-1 duration-100 outline-none data-[size=default]:max-w-xs data-[size=sm]:max-w-xs data-[size=default]:sm:max-w-sm',
          className,
        )}
        {...rest}
      />
    </AlertDialogPortal>
  );
}

// ------------------------------------------------------------
// AlertDialogHeader
// ------------------------------------------------------------

export type AlertDialogHeaderProps = ComponentProps<'div'>;

function AlertDialogHeader(props: AlertDialogHeaderProps) {
  const { className, ...rest } = props;
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn(
        'grid grid-rows-[auto_1fr] place-items-center gap-1.5 text-center has-data-[slot=alert-dialog-media]:grid-rows-[auto_auto_1fr] has-data-[slot=alert-dialog-media]:gap-x-4 sm:group-data-[size=default]/alert-dialog-content:place-items-start sm:group-data-[size=default]/alert-dialog-content:text-left sm:group-data-[size=default]/alert-dialog-content:has-data-[slot=alert-dialog-media]:grid-rows-[auto_1fr]',
        className,
      )}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// AlertDialogFooter
// ------------------------------------------------------------

export type AlertDialogFooterProps = ComponentProps<'div'>;

function AlertDialogFooter(props: AlertDialogFooterProps) {
  const { className, ...rest } = props;
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        'bg-muted/50 -mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t p-4 group-data-[size=sm]/alert-dialog-content:grid group-data-[size=sm]/alert-dialog-content:grid-cols-2 sm:flex-row sm:justify-end',
        className,
      )}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// AlertDialogMedia
// ------------------------------------------------------------

export type AlertDialogMediaProps = ComponentProps<'div'>;

function AlertDialogMedia(props: AlertDialogMediaProps) {
  const { className, ...rest } = props;
  return (
    <div
      data-slot="alert-dialog-media"
      className={cn(
        "bg-muted mb-2 inline-flex size-10 items-center justify-center rounded-md sm:group-data-[size=default]/alert-dialog-content:row-span-2 *:[svg:not([class*='size-'])]:size-6",
        className,
      )}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// AlertDialogTitle
// ------------------------------------------------------------

export type AlertDialogTitleProps = ComponentProps<typeof AlertDialogPrimitive.Title>;

function AlertDialogTitle(props: AlertDialogTitleProps) {
  const { className, ...rest } = props;
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn(
        'cn-font-heading text-base font-medium sm:group-data-[size=default]/alert-dialog-content:group-has-data-[slot=alert-dialog-media]/alert-dialog-content:col-start-2',
        className,
      )}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// AlertDialogDescription
// ------------------------------------------------------------

export type AlertDialogDescriptionProps = ComponentProps<typeof AlertDialogPrimitive.Description>;

function AlertDialogDescription(props: AlertDialogDescriptionProps) {
  const { className, ...rest } = props;
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn(
        'text-muted-foreground *:[a]:hover:text-foreground text-sm text-balance md:text-pretty *:[a]:underline *:[a]:underline-offset-3',
        className,
      )}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// AlertDialogAction
// ------------------------------------------------------------

export type AlertDialogActionProps = ComponentProps<typeof AlertDialogPrimitive.Action> &
  Pick<ComponentProps<typeof Button>, 'variant' | 'size'>;

function AlertDialogAction(props: AlertDialogActionProps) {
  const { className, variant = 'default', size = 'default', ...rest } = props;
  return (
    <Button variant={variant} size={size} asChild>
      <AlertDialogPrimitive.Action data-slot="alert-dialog-action" className={cn(className)} {...rest} />
    </Button>
  );
}

// ------------------------------------------------------------
// AlertDialogCancel
// ------------------------------------------------------------

export type AlertDialogCancelProps = ComponentProps<typeof AlertDialogPrimitive.Cancel> &
  Pick<ComponentProps<typeof Button>, 'variant' | 'size'>;

function AlertDialogCancel(props: AlertDialogCancelProps) {
  const { className, variant = 'outline', size = 'default', ...rest } = props;
  return (
    <Button variant={variant} size={size} asChild>
      <AlertDialogPrimitive.Cancel data-slot="alert-dialog-cancel" className={cn(className)} {...rest} />
    </Button>
  );
}
