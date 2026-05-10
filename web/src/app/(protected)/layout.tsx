import Link from 'next/link';
import type { ReactNode } from 'react';

import { QueryProvider } from '@web/lib/query/query-provider';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <div className="bg-background flex h-dvh flex-col">
        <header className="border-border bg-background/95 z-10 border-b backdrop-blur">
          <div className="flex h-12 w-full items-center justify-between px-4">
            <Link href="/workspaces" className="text-sm font-semibold tracking-tight">
              Daily Logs
            </Link>
          </div>
        </header>
        {/* `flex` implicitly has `min-h-auto`, so we override it to `min-h-0` here to allow `main` to 
        shrink below its content, which would allow the content to opt into internal scrolling. */}
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</main>
      </div>
    </QueryProvider>
  );
}
