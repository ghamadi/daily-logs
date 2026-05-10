import Link from 'next/link';

import { WorkspacesService } from '@domains/workspaces/services/workspaces-service';
import { getDb } from '@infrastructure/db/get-db';
import { DrizzleWorkspacesRepository } from '@infrastructure/repositories/workspaces/drizzle-workspaces-repository';
import { getAuthenticatedPrincipal } from '@web/lib/utils/api/auth';

import { CreateWorkspaceDialog } from './_components/create-workspace-dialog';

export const dynamic = 'force-dynamic';

export default async function WorkspacesPage() {
  const principal = await getAuthenticatedPrincipal();
  const service = new WorkspacesService(new DrizzleWorkspacesRepository(getDb()));
  const workspaces = await service.listWorkspacesForUser(principal.id);

  return (
    <div className="w-full px-4 py-10">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Workspaces</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Pick a workspace to view its chats, or create a new one.
          </p>
        </div>
        <CreateWorkspaceDialog />
      </div>

      {workspaces.length === 0 ? (
        <div className="border-border text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
          You don&apos;t have any workspaces yet. Create one to get started.
        </div>
      ) : (
        <ul className="border-border divide-border divide-y rounded-xl border">
          {workspaces.map((workspace) => (
            <li key={workspace.id}>
              <Link
                href={`/workspaces/${workspace.id}`}
                className="hover:bg-muted/50 flex items-center justify-between gap-4 px-4 py-3 transition-colors"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{workspace.name}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    Updated {workspace.updatedAt.toLocaleDateString()}
                  </p>
                </div>
                <span className="text-muted-foreground text-xs">Open →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
