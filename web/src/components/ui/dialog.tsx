'use client';

import { XIcon } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { cn, composeCompoundComponent } from '@web/lib/utils/components';
import { Button } from '@web/components/ui/button';
import { ComponentProps, useMemo } from 'react';

export const Dialog = composeCompoundComponent(DialogRoot, {
  Trigger: DialogTrigger,
  Portal: DialogPortal,
  Close: DialogClose,
  Content: DialogContent,
  Header: DialogHeader,
  Footer: DialogFooter,
  Title: DialogTitle,
  Description: DialogDescription,
});

// ------------------------------------------------------------
// DialogRoot
// ------------------------------------------------------------

export type DialogProps = ComponentProps<typeof DialogPrimitive.Root>;

function DialogRoot(props: DialogProps) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

// ------------------------------------------------------------
// DialogTrigger
// ------------------------------------------------------------

export type DialogTriggerProps = ComponentProps<typeof DialogPrimitive.Trigger>;

function DialogTrigger(props: DialogTriggerProps) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

// ------------------------------------------------------------
// DialogPortal
// ------------------------------------------------------------

export type DialogPortalProps = ComponentProps<typeof DialogPrimitive.Portal>;

function DialogPortal(props: DialogPortalProps) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

// ------------------------------------------------------------
// DialogClose
// ------------------------------------------------------------

export type DialogCloseProps = ComponentProps<typeof DialogPrimitive.Close>;

function DialogClose(props: DialogCloseProps) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

// ------------------------------------------------------------
// DialogOverlay
// ------------------------------------------------------------

export type DialogOverlayProps = ComponentProps<typeof DialogPrimitive.Overlay>;

function DialogOverlay(props: DialogOverlayProps) {
  const { className, ...rest } = props;
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs',
        className,
      )}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// DialogContent
// ------------------------------------------------------------

export type DialogContentProps = ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
  portal?: DialogPortalProps;
};

function DialogContent(props: DialogContentProps) {
  const { className, children, showCloseButton = true, portal, ...rest } = props;

  const { container, ...portalProps } = portal ?? {};

  const dialogContainer = useMemo(
    () => container ?? document.getElementById('dialog-root'),
    [container],
  );

  return (
    <DialogPortal container={dialogContainer} {...portalProps}>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          'bg-popover text-popover-foreground ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl p-4 text-sm ring-1 duration-100 outline-none sm:max-w-sm',
          className,
        )}
        {...rest}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close data-slot="dialog-close" asChild>
            <Button variant="ghost" className="absolute top-2 right-2" size="icon-sm">
              <XIcon />
              <span className="sr-only">Close</span>
            </Button>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

// ------------------------------------------------------------
// DialogHeader
// ------------------------------------------------------------

export type DialogHeaderProps = ComponentProps<'div'>;

function DialogHeader(props: DialogHeaderProps) {
  const { className, ...rest } = props;
  return <div data-slot="dialog-header" className={cn('flex flex-col gap-2', className)} {...rest} />;
}

// ------------------------------------------------------------
// DialogFooter
// ------------------------------------------------------------

export type DialogFooterProps = ComponentProps<'div'> & {
  showCloseButton?: boolean;
};

function DialogFooter(props: DialogFooterProps) {
  const { className, showCloseButton = false, children, ...rest } = props;
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'bg-muted/50 -mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t p-4 sm:flex-row sm:justify-end',
        className,
      )}
      {...rest}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// DialogTitle
// ------------------------------------------------------------

export type DialogTitleProps = ComponentProps<typeof DialogPrimitive.Title>;

function DialogTitle(props: DialogTitleProps) {
  const { className, ...rest } = props;
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('cn-font-heading text-base leading-none font-medium', className)}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// DialogDescription
// ------------------------------------------------------------

export type DialogDescriptionProps = ComponentProps<typeof DialogPrimitive.Description>;

function DialogDescription(props: DialogDescriptionProps) {
  const { className, ...rest } = props;
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        'text-muted-foreground *:[a]:hover:text-foreground text-sm *:[a]:underline *:[a]:underline-offset-3',
        className,
      )}
      {...rest}
    />
  );
}
