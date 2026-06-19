'use client';

import type { ComponentProps } from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { cn, composeCompoundComponent } from '@/lib/utils/components';
import { useLayer } from '@/hooks/use-layer';

export const Drawer = composeCompoundComponent(DrawerRoot, {
  Trigger: DrawerTrigger,
  Portal: DrawerPortal,
  Close: DrawerClose,
  Overlay: DrawerOverlay,
  Content: DrawerContent,
  Header: DrawerHeader,
  Footer: DrawerFooter,
  Title: DrawerTitle,
  Description: DrawerDescription,
});

// ------------------------------------------------------------
// DrawerRoot
// ------------------------------------------------------------

export type DrawerProps = ComponentProps<typeof DrawerPrimitive.Root>;

function DrawerRoot(props: DrawerProps) {
  return <DrawerPrimitive.Root data-slot="drawer" {...props} />;
}

// ------------------------------------------------------------
// DrawerTrigger
// ------------------------------------------------------------

export type DrawerTriggerProps = ComponentProps<typeof DrawerPrimitive.Trigger>;

function DrawerTrigger(props: DrawerTriggerProps) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

// ------------------------------------------------------------
// DrawerPortal
// ------------------------------------------------------------

export type DrawerPortalProps = ComponentProps<typeof DrawerPrimitive.Portal>;

function DrawerPortal(props: DrawerPortalProps) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

// ------------------------------------------------------------
// DrawerClose
// ------------------------------------------------------------

export type DrawerCloseProps = ComponentProps<typeof DrawerPrimitive.Close>;

function DrawerClose(props: DrawerCloseProps) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

// ------------------------------------------------------------
// DrawerOverlay
// ------------------------------------------------------------

export type DrawerOverlayProps = ComponentProps<typeof DrawerPrimitive.Overlay>;

function DrawerOverlay(props: DrawerOverlayProps) {
  const { className, ...rest } = props;
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn(
        'data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 fixed inset-0 bg-black/10 supports-backdrop-filter:backdrop-blur-xs',
        className,
      )}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// DrawerContent
// ------------------------------------------------------------

export type DrawerContentProps = ComponentProps<typeof DrawerPrimitive.Content> & {
  portal?: DrawerPortalProps;
};

function DrawerContent(props: DrawerContentProps) {
  const { className, children, portal, style, ...rest } = props;
  const { container, ...portalProps } = portal ?? {};

  const interactiveLayer = useLayer('interactive');

  return (
    <DrawerPortal container={container ?? interactiveLayer.container} {...portalProps}>
      <DrawerOverlay style={{ zIndex: interactiveLayer.zIndex }} />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        style={{ zIndex: interactiveLayer.zIndex, ...style }}
        className={cn(
          'group/drawer-content bg-popover text-popover-foreground fixed flex h-auto flex-col text-sm data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80vh] data-[vaul-drawer-direction=bottom]:rounded-t-xl data-[vaul-drawer-direction=bottom]:border-t data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:rounded-r-xl data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:rounded-l-xl data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=top]:rounded-b-xl data-[vaul-drawer-direction=top]:border-b data-[vaul-drawer-direction=left]:sm:max-w-sm data-[vaul-drawer-direction=right]:sm:max-w-sm',
          className,
        )}
        {...rest}
      >
        <div className="bg-muted mx-auto mt-4 hidden h-1 w-[100px] shrink-0 rounded-full group-data-[vaul-drawer-direction=bottom]/drawer-content:block" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
}

// ------------------------------------------------------------
// DrawerHeader
// ------------------------------------------------------------

export type DrawerHeaderProps = ComponentProps<'div'>;

function DrawerHeader(props: DrawerHeaderProps) {
  const { className, ...rest } = props;
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        'flex flex-col gap-0.5 p-4 group-data-[vaul-drawer-direction=bottom]/drawer-content:text-center group-data-[vaul-drawer-direction=top]/drawer-content:text-center md:gap-0.5 md:text-left',
        className,
      )}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// DrawerFooter
// ------------------------------------------------------------

export type DrawerFooterProps = ComponentProps<'div'>;

function DrawerFooter(props: DrawerFooterProps) {
  const { className, ...rest } = props;
  return (
    <div
      data-slot="drawer-footer"
      className={cn('mt-auto flex flex-col gap-2 p-4', className)}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// DrawerTitle
// ------------------------------------------------------------

export type DrawerTitleProps = ComponentProps<typeof DrawerPrimitive.Title>;

function DrawerTitle(props: DrawerTitleProps) {
  const { className, ...rest } = props;
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn('cn-font-heading text-foreground text-base font-medium', className)}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// DrawerDescription
// ------------------------------------------------------------

export type DrawerDescriptionProps = ComponentProps<typeof DrawerPrimitive.Description>;

function DrawerDescription(props: DrawerDescriptionProps) {
  const { className, ...rest } = props;
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...rest}
    />
  );
}
