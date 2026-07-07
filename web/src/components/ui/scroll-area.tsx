'use client';

import { ScrollArea as ScrollAreaPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn, composeCompoundComponent } from '@/lib/utils/components';

export const ScrollArea = composeCompoundComponent(ScrollAreaRoot, {
  Scrollbar: ScrollAreaScrollbar,
});

// ------------------------------------------------------------
// ScrollAreaRoot
// ------------------------------------------------------------

export type ScrollAreaProps = ComponentProps<typeof ScrollAreaPrimitive.Root>;

function ScrollAreaRoot(props: ScrollAreaProps) {
  const { className, children, ...rest } = props;
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn('relative', className)}
      {...rest}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollAreaScrollbar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

// ------------------------------------------------------------
// ScrollAreaScrollbar
// ------------------------------------------------------------

export type ScrollAreaScrollbarProps = ComponentProps<
  typeof ScrollAreaPrimitive.ScrollAreaScrollbar
>;

function ScrollAreaScrollbar(props: ScrollAreaScrollbarProps) {
  const { className, orientation = 'vertical', ...rest } = props;
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        'flex touch-none p-px transition-colors select-none data-horizontal:h-2.5 data-horizontal:flex-col data-horizontal:border-t data-horizontal:border-t-transparent data-vertical:h-full data-vertical:w-2.5 data-vertical:border-l data-vertical:border-l-transparent',
        className,
      )}
      {...rest}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-border"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  );
}
