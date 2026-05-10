'use client';

import { Tooltip as TooltipPrimitive } from 'radix-ui';
import { type ComponentProps } from 'react';

export type TooltipProviderProps = ComponentProps<typeof TooltipPrimitive.Provider>;

export function TooltipProvider(props: TooltipProviderProps) {
  const { delayDuration = 0, ...rest } = props;
  return (
    <TooltipPrimitive.Provider data-slot="tooltip-provider" delayDuration={delayDuration} {...rest} />
  );
}
