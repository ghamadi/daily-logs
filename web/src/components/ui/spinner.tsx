import type { ComponentProps } from 'react';

import { Loader2Icon } from 'lucide-react';

import { cn } from '@/lib/utils/components';

export type SpinnerProps = ComponentProps<'svg'>;

export function Spinner(props: SpinnerProps) {
  const { className, ...rest } = props;
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      data-slot="spinner"
      className={cn('size-4 animate-spin', className)}
      {...rest}
    />
  );
}
