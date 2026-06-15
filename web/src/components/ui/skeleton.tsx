import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils/components';

export type SkeletonProps = ComponentProps<'div'>;

export function Skeleton(props: SkeletonProps) {
  const { className, ...rest } = props;
  return <div data-slot="skeleton" className={cn('animate-pulse rounded-md bg-muted', className)} {...rest} />;
}
