'use client';

import { HoverCard as HoverCardPrimitive } from 'radix-ui';
import { cn, composeCompoundComponent } from '@/lib/utils/components';
import { ComponentProps } from 'react';
import { useLayer } from '@/hooks/use-layer';

export const HoverCard = composeCompoundComponent(HoverCardRoot, {
  Trigger: HoverCardTrigger,
  Content: HoverCardContent,
});

// ------------------------------------------------------------
// HoverCardRoot
// ------------------------------------------------------------

export type HoverCardProps = ComponentProps<typeof HoverCardPrimitive.Root>;

function HoverCardRoot(props: HoverCardProps) {
  return <HoverCardPrimitive.Root data-slot="hover-card" {...props} />;
}

// ------------------------------------------------------------
// HoverCardTrigger
// ------------------------------------------------------------

export type HoverCardTriggerProps = ComponentProps<typeof HoverCardPrimitive.Trigger>;

function HoverCardTrigger(props: HoverCardTriggerProps) {
  return <HoverCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />;
}

// ------------------------------------------------------------
// HoverCardContent
// ------------------------------------------------------------

export type HoverCardContentProps = ComponentProps<typeof HoverCardPrimitive.Content> & {
  portal?: ComponentProps<typeof HoverCardPrimitive.Portal>;
};

function HoverCardContent(props: HoverCardContentProps) {
  const { className, align = 'center', sideOffset = 4, portal, style, ...rest } = props;
  const { container, ...portalProps } = portal ?? {};

  const notificationLayer = useLayer('notification');

  return (
    <HoverCardPrimitive.Portal container={container ?? notificationLayer.container} {...portalProps}>
      <HoverCardPrimitive.Content
        data-slot="hover-card-content"
        align={align}
        sideOffset={sideOffset}
        style={{ zIndex: notificationLayer.zIndex, ...style }}
        className={cn(
          'bg-popover text-popover-foreground ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 w-64 origin-(--radix-hover-card-content-transform-origin) rounded-lg p-2.5 text-sm ring-1 outline-hidden duration-100',
          className,
        )}
        {...rest}
      />
    </HoverCardPrimitive.Portal>
  );
}
