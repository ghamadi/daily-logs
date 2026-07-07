'use client';

import { Collapsible as CollapsiblePrimitive } from 'radix-ui';
import { composeCompoundComponent } from '@/lib/utils/components';
import type { ComponentProps } from 'react';

export const Collapsible = composeCompoundComponent(CollapsibleRoot, {
  Trigger: CollapsibleTrigger,
  Content: CollapsibleContent,
});

// ------------------------------------------------------------
// CollapsibleRoot
// ------------------------------------------------------------

export type CollapsibleProps = ComponentProps<typeof CollapsiblePrimitive.Root>;

function CollapsibleRoot(props: CollapsibleProps) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}

// ------------------------------------------------------------
// CollapsibleTrigger
// ------------------------------------------------------------

export type CollapsibleTriggerProps = ComponentProps<typeof CollapsiblePrimitive.Trigger>;

function CollapsibleTrigger(props: CollapsibleTriggerProps) {
  return <CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" {...props} />;
}

// ------------------------------------------------------------
// CollapsibleContent
// ------------------------------------------------------------

export type CollapsibleContentProps = ComponentProps<typeof CollapsiblePrimitive.Content>;

function CollapsibleContent(props: CollapsibleContentProps) {
  return <CollapsiblePrimitive.Content data-slot="collapsible-content" {...props} />;
}
