import Link from 'next/link';
import type { ReactNode } from 'react';

import { QueryProvider } from '@web/lib/query/query-provider';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <div className="bg-background flex min-h-screen flex-col">
        <header className="border-border bg-background/95 sticky top-0 z-10 border-b backdrop-blur">
          <div className="mx-auto flex h-12 w-full max-w-5xl items-center justify-between px-4">
            <Link href="/workspaces" className="text-sm font-semibold tracking-tight">
              Daily Logs
            </Link>
          </div>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
        <div id="dialog-root" />
      </div>
    </QueryProvider>
  );
}
