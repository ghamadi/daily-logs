import { QueryProvider } from '@web/components/root-providers/query-provider';
import { TooltipProvider } from '@web/components/root-providers/tooltip-provider';
import { ReactNode } from 'react';

export function RootProviders(props: { children: ReactNode }) {
  const { children } = props;

  return (
    <TooltipProvider>
      <QueryProvider>{children}</QueryProvider>
    </TooltipProvider>
  );
}
