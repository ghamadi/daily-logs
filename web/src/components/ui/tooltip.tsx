'use client';

import { Tooltip as TooltipPrimitive } from 'radix-ui';
import { cn, composeCompoundComponent } from '@/lib/utils/components';
import { ComponentProps } from 'react';
import { usePortalContainer } from '@/hooks/use-portal-container';

export const Tooltip = composeCompoundComponent(TooltipRoot, {
  Trigger: TooltipTrigger,
  Content: TooltipContent,
});

export type TooltipProviderProps = ComponentProps<typeof TooltipPrimitive.Provider>;

export function TooltipProvider(props: TooltipProviderProps) {
  const { delayDuration = 0, ...rest } = props;
  return (
    <TooltipPrimitive.Provider data-slot="tooltip-provider" delayDuration={delayDuration} {...rest} />
  );
}

// ------------------------------------------------------------
// TooltipRoot
// ------------------------------------------------------------
export type TooltipProps = ComponentProps<typeof TooltipPrimitive.Root>;

function TooltipRoot(props: ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

// ------------------------------------------------------------
// TooltipTrigger
// ------------------------------------------------------------
export type TooltipTriggerProps = ComponentProps<typeof TooltipPrimitive.Trigger>;

function TooltipTrigger(props: TooltipTriggerProps) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

// ------------------------------------------------------------
// TooltipContent
// ------------------------------------------------------------
export type TooltipContentProps = ComponentProps<typeof TooltipPrimitive.Content> & {
  portal?: ComponentProps<typeof TooltipPrimitive.Portal>;
};

function TooltipContent(props: TooltipContentProps) {
  const { className, sideOffset = 0, children, portal, ...rest } = props;
  const { container, ...portalProps } = portal ?? {};

  const tooltipContainer = usePortalContainer({
    container,
    fallbackContainerId: 'tooltip-root',
  });

  return (
    <TooltipPrimitive.Portal container={tooltipContainer} {...portalProps}>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          'bg-foreground text-background data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 z-50 inline-flex w-fit max-w-xs origin-(--radix-tooltip-content-transform-origin) items-center gap-1.5 rounded-md px-3 py-1.5 text-xs has-data-[slot=kbd]:pr-1.5 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-sm',
          className,
        )}
        {...rest}
      >
        {children}
        <TooltipPrimitive.Arrow className="bg-foreground fill-foreground z-50 size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px]" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}
