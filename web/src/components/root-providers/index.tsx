import type { ReactNode } from 'react';
import { QueryProvider } from '@/components/root-providers/query-provider';
import { LayerStackProvider } from '@/components/root-providers/layer-stack-provider';
import { ThemeProvider } from '@/components/root-providers/theme-provider';
import { Toaster } from '@/components/ui/toaster';

export function RootProviders(props: { children: ReactNode }) {
  const { children } = props;

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <QueryProvider>
        <LayerStackProvider>
          {children}
          <Toaster />
        </LayerStackProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
