import { QueryProvider } from '@web/components/root-providers/query-provider';
import { ReactNode } from 'react';

export function RootProviders(props: { children: ReactNode }) {
  const { children } = props;

  return <QueryProvider>{children}</QueryProvider>;
}
