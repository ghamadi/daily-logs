import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ChatsService } from '@domains/chats/services/chats-service';
import { DomainErrors } from '@domains/lib/errors';
import { WorkspacesService } from '@domains/workspaces/services/workspaces-service';
import { getDb } from '@infrastructure/db/get-db';
import { DrizzleChatRepository } from '@infrastructure/repositories/chats/drizzle-chat-repository';
import { DrizzleWorkspacesRepository } from '@infrastructure/repositories/workspaces/drizzle-workspaces-repository';
import { getAuthenticatedPrincipal } from '@web/lib/utils/api/auth';

import { NewChatButton } from './_components/new-chat-button';

export const dynamic = 'force-dynamic';

type WorkspacePageProps = {
  params: Promise<{ workspaceId: string }>;
};

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { workspaceId } = await params;
  const principal = await getAuthenticatedPrincipal();

  const db = getDb();
  const workspacesRepo = new DrizzleWorkspacesRepository(db);
  const workspacesService = new WorkspacesService(workspacesRepo);
  const chatsService = new ChatsService(new DrizzleChatRepository(db), workspacesRepo);

  const [workspace, chats] = await Promise.all([
    // Mirrors the API behaviour: an unknown workspace and one the principal
    // can't see both look like 404 from the UI's perspective.
    workspacesService
      .getWorkspaceById({ id: workspaceId, principalId: principal.id })
      .catch(handleAsNotFound),
    chatsService.listChats({ workspaceId, principalId: principal.id }).catch(handleAsNotFound),
  ]);

  return (
    <div className="w-full px-4 py-10">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <Link href="/workspaces" className="text-muted-foreground hover:text-foreground text-xs">
            ← Workspaces
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{workspace.name}</h1>
          <p className="text-muted-foreground mt-1 text-sm">Your chats in this workspace.</p>
        </div>
        <NewChatButton workspaceId={workspaceId} />
      </div>

      {chats.length === 0 ? (
        <div className="border-border text-muted-foreground flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center text-sm">
          <p>No chats yet.</p>
          <NewChatButton workspaceId={workspaceId} variant="default" label="Start a new chat" />
        </div>
      ) : (
        <ul className="border-border divide-border divide-y rounded-xl border">
          {chats.map((chat) => (
            <li key={chat.id}>
              <Link
                href={`/workspaces/${workspaceId}/chats/${chat.id}`}
                className="hover:bg-muted/50 flex items-center justify-between gap-4 px-4 py-3 transition-colors"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{chat.title ?? 'Untitled chat'}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    Updated {chat.updatedAt.toLocaleString()}
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

function handleAsNotFound(error: unknown): never {
  if (error instanceof DomainErrors.NotFoundError || error instanceof DomainErrors.AccessDeniedError) {
    notFound();
  }
  throw error;
}
