import type { ComponentProps } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn, composeCompoundComponent } from '@/lib/utils/components';

export const Callout = composeCompoundComponent(CalloutRoot, {
  Title: CalloutTitle,
  Description: CalloutDescription,
  Action: CalloutAction,
});

// ------------------------------------------------------------
// CalloutRoot
// ------------------------------------------------------------

const calloutVariants = cva(
  "group/callout relative grid w-full gap-0.5 rounded-lg border px-2.5 py-2 text-left text-sm has-data-[slot=callout-action]:relative has-data-[slot=callout-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground',
        destructive:
          'bg-card text-destructive *:data-[slot=callout-description]:text-destructive/90 *:[svg]:text-current',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export type CalloutProps = ComponentProps<'div'> & VariantProps<typeof calloutVariants>;

function CalloutRoot(props: CalloutProps) {
  const { className, variant, ...rest } = props;
  return (
    <div
      data-slot="callout"
      role="alert"
      className={cn(calloutVariants({ variant }), className)}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// CalloutTitle
// ------------------------------------------------------------

export type CalloutTitleProps = ComponentProps<'div'>;

function CalloutTitle(props: CalloutTitleProps) {
  const { className, ...rest } = props;
  return (
    <div
      data-slot="callout-title"
      className={cn(
        'font-medium group-has-[>svg]/callout:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground',
        className,
      )}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// CalloutDescription
// ------------------------------------------------------------

export type CalloutDescriptionProps = ComponentProps<'div'>;

function CalloutDescription(props: CalloutDescriptionProps) {
  const { className, ...rest } = props;
  return (
    <div
      data-slot="callout-description"
      className={cn(
        'text-sm text-balance text-muted-foreground md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4',
        className,
      )}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// CalloutAction
// ------------------------------------------------------------

export type CalloutActionProps = ComponentProps<'div'>;

function CalloutAction(props: CalloutActionProps) {
  const { className, ...rest } = props;
  return (
    <div
      data-slot="callout-action"
      className={cn('absolute top-2 right-2', className)}
      {...rest}
    />
  );
}
