'use client';

import { XIcon } from 'lucide-react';
import { Dialog as SheetPrimitive } from 'radix-ui';
import { cn, composeCompoundComponent } from '@/lib/utils/components';
import type { ComponentProps } from 'react';
import { useLayer } from '@/hooks/use-layer';
import { Button } from '@/components/ui/button';

export const Sheet = composeCompoundComponent(SheetRoot, {
  Trigger: SheetTrigger,
  Close: SheetClose,
  Content: SheetContent,
  Header: SheetHeader,
  Footer: SheetFooter,
  Title: SheetTitle,
  Description: SheetDescription,
});

// ------------------------------------------------------------
// SheetRoot
// ------------------------------------------------------------

export type SheetProps = ComponentProps<typeof SheetPrimitive.Root>;

function SheetRoot(props: SheetProps) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

// ------------------------------------------------------------
// SheetTrigger
// ------------------------------------------------------------

export type SheetTriggerProps = ComponentProps<typeof SheetPrimitive.Trigger>;

function SheetTrigger(props: SheetTriggerProps) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

// ------------------------------------------------------------
// SheetClose
// ------------------------------------------------------------

export type SheetCloseProps = ComponentProps<typeof SheetPrimitive.Close>;

function SheetClose(props: SheetCloseProps) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

// ------------------------------------------------------------
// SheetPortal (internal)
// ------------------------------------------------------------

type SheetPortalProps = ComponentProps<typeof SheetPrimitive.Portal>;

function SheetPortal(props: SheetPortalProps) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

// ------------------------------------------------------------
// SheetOverlay (internal)
// ------------------------------------------------------------

type SheetOverlayProps = ComponentProps<typeof SheetPrimitive.Overlay>;

function SheetOverlay(props: SheetOverlayProps) {
  const { className, ...rest } = props;
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        'fixed inset-0 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0',
        className,
      )}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// SheetContent
// ------------------------------------------------------------

export type SheetContentProps = ComponentProps<typeof SheetPrimitive.Content> & {
  side?: 'top' | 'right' | 'bottom' | 'left';
  showCloseButton?: boolean;
  portal?: SheetPortalProps;
};

function SheetContent(props: SheetContentProps) {
  const { className, children, side = 'right', showCloseButton = true, portal, style, ...rest } =
    props;

  const { container, ...portalProps } = portal ?? {};

  const interactiveLayer = useLayer('interactive');

  return (
    <SheetPortal container={container ?? interactiveLayer.container} {...portalProps}>
      <SheetOverlay style={{ zIndex: interactiveLayer.zIndex }} />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        data-side={side}
        style={{ zIndex: interactiveLayer.zIndex, ...style }}
        className={cn(
          'fixed flex flex-col gap-4 bg-popover bg-clip-padding text-sm text-popover-foreground shadow-lg transition duration-200 ease-in-out data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:border-t data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:border-r data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=right]:border-l data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-[side=bottom]:data-open:slide-in-from-bottom-10 data-[side=left]:data-open:slide-in-from-left-10 data-[side=right]:data-open:slide-in-from-right-10 data-[side=top]:data-open:slide-in-from-top-10 data-closed:animate-out data-closed:fade-out-0 data-[side=bottom]:data-closed:slide-out-to-bottom-10 data-[side=left]:data-closed:slide-out-to-left-10 data-[side=right]:data-closed:slide-out-to-right-10 data-[side=top]:data-closed:slide-out-to-top-10',
          className,
        )}
        {...rest}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close data-slot="sheet-close" asChild>
            <Button variant="ghost" className="absolute top-3 right-3" size="icon-sm">
              <XIcon />
              <span className="sr-only">Close</span>
            </Button>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

// ------------------------------------------------------------
// SheetHeader
// ------------------------------------------------------------

export type SheetHeaderProps = ComponentProps<'div'>;

function SheetHeader(props: SheetHeaderProps) {
  const { className, ...rest } = props;
  return <div data-slot="sheet-header" className={cn('flex flex-col gap-0.5 p-4', className)} {...rest} />;
}

// ------------------------------------------------------------
// SheetFooter
// ------------------------------------------------------------

export type SheetFooterProps = ComponentProps<'div'>;

function SheetFooter(props: SheetFooterProps) {
  const { className, ...rest } = props;
  return <div data-slot="sheet-footer" className={cn('mt-auto flex flex-col gap-2 p-4', className)} {...rest} />;
}

// ------------------------------------------------------------
// SheetTitle
// ------------------------------------------------------------

export type SheetTitleProps = ComponentProps<typeof SheetPrimitive.Title>;

function SheetTitle(props: SheetTitleProps) {
  const { className, ...rest } = props;
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn('cn-font-heading text-base font-medium text-foreground', className)}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// SheetDescription
// ------------------------------------------------------------

export type SheetDescriptionProps = ComponentProps<typeof SheetPrimitive.Description>;

function SheetDescription(props: SheetDescriptionProps) {
  const { className, ...rest } = props;
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...rest}
    />
  );
}
