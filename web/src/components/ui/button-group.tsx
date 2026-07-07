import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import { cn, composeCompoundComponent } from '@/lib/utils/components';
import { Separator, SeparatorProps } from '@/components/ui/separator';

export const ButtonGroup = composeCompoundComponent(ButtonGroupRoot, {
  Text: ButtonGroupText,
  Separator: ButtonGroupSeparator,
});

// ------------------------------------------------------------
// ButtonGroupRoot
// ------------------------------------------------------------

const buttonGroupVariants = cva(
  "group/button-group flex w-fit items-stretch *:focus-visible:relative *:focus-visible:z-10 has-[>[data-slot=button-group]]:gap-2 has-[select[aria-hidden=true]:last-child]:[&>[data-slot=select-trigger]:last-of-type]:rounded-r-lg [&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&>input]:flex-1",
  {
    variants: {
      orientation: {
        horizontal:
          '[&>*:not(:first-child)]:rounded-l-none [&>*:not(:first-child)]:border-l-0 [&>*:not(:last-child)]:rounded-r-none [&>[data-slot]:not(:has(~[data-slot]))]:rounded-r-lg!',
        vertical:
          'flex-col [&>*:not(:first-child)]:rounded-t-none [&>*:not(:first-child)]:border-t-0 [&>*:not(:last-child)]:rounded-b-none [&>[data-slot]:not(:has(~[data-slot]))]:rounded-b-lg!',
      },
    },
    defaultVariants: {
      orientation: 'horizontal',
    },
  },
);

export type ButtonGroupRootProps = React.ComponentProps<'div'> &
  VariantProps<typeof buttonGroupVariants>;

function ButtonGroupRoot(props: ButtonGroupRootProps) {
  const { className, orientation, ...rest } = props;

  return (
    <div
      role="group"
      data-slot="button-group"
      data-orientation={orientation}
      className={cn(buttonGroupVariants({ orientation }), className)}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// ButtonGroupText
// ------------------------------------------------------------

export type ButtonGroupTextProps = React.ComponentProps<'div'> & {
  asChild?: boolean;
};

function ButtonGroupText(props: ButtonGroupTextProps) {
  const { className, asChild = false, ...rest } = props;
  const Comp = asChild ? Slot.Root : 'div';

  return (
    <Comp
      data-slot="button-group-text"
      className={cn(
        "bg-muted flex items-center gap-2 rounded-lg border px-2.5 text-sm font-medium [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// ButtonGroupSeparator
// ------------------------------------------------------------

export type ButtonGroupSeparatorProps = SeparatorProps;

function ButtonGroupSeparator(props: ButtonGroupSeparatorProps) {
  const { className, orientation = 'vertical', ...rest } = props;
  return (
    <Separator
      data-slot="button-group-separator"
      orientation={orientation}
      className={cn(
        'bg-input relative self-stretch data-horizontal:mx-px data-horizontal:w-auto data-vertical:my-px data-vertical:h-auto',
        className,
      )}
      {...rest}
    />
  );
}
