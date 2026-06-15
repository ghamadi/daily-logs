import { QueryProvider } from '@/components/root-providers/query-provider';
import { LayerStackProvider } from '@/components/root-providers/layer-stack-provider';
import { ReactNode } from 'react';

export function RootProviders(props: { children: ReactNode }) {
  const { children } = props;

  return (
    <QueryProvider>
      <LayerStackProvider>{children}</LayerStackProvider>
    </QueryProvider>
  );
}
