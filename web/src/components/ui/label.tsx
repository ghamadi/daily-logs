import { Label as LabelPrimitive } from 'radix-ui';
import { ComponentPropsWithRef } from 'react';
import { cn } from '@web/lib/utils';

export type LabelProps = ComponentPropsWithRef<typeof LabelPrimitive.Root>;

export function Label(props: LabelProps) {
  const { className, ...rest } = props;
  return (
    <LabelPrimitive.Root
      className={cn(
        'text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className,
      )}
      {...rest}
    />
  );
}
