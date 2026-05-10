import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChatsService } from '@domains/chats/services/chats-service';
import { DomainErrors } from '@domains/lib/errors';
import { getDb } from '@infrastructure/db/get-db';
import { DrizzleChatRepository } from '@infrastructure/repositories/chats/drizzle-chat-repository';
import { DrizzleWorkspacesRepository } from '@infrastructure/repositories/workspaces/drizzle-workspaces-repository';
import { ChatThread } from '@web/app/(protected)/workspaces/[workspaceId]/chats/_components/chat-thread';
import { getAuthenticatedPrincipal } from '@web/lib/utils/api/auth';

export const dynamic = 'force-dynamic';

type ChatPageProps = {
  params: Promise<{ workspaceId: string; chatId: string }>;
};

export default async function ChatPage({ params }: ChatPageProps) {
  const { workspaceId, chatId } = await params;
  const principal = await getAuthenticatedPrincipal();

  const db = getDb();
  const chatsService = new ChatsService(
    new DrizzleChatRepository(db),
    new DrizzleWorkspacesRepository(db),
  );

  // Both calls go through the same auth/membership/ownership guard, so a
  // failure on either is the same "you can't see this chat" outcome from a
  // privacy standpoint — translate to 404 to avoid confirming existence.
  const [chat, history] = await Promise.all([
    chatsService.getChatById({ chatId, workspaceId, principalId: principal.id }).catch(handleAsNotFound),
    chatsService
      .loadChatMessages({ chatId, workspaceId, principalId: principal.id })
      .catch(handleAsNotFound),
  ]);

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-1 flex-col">
      <header className="border-border border-b px-4 py-4">
        <Link
          href={`/workspaces/${workspaceId}`}
          className="text-muted-foreground hover:text-foreground text-xs"
        >
          ← Chats
        </Link>
        <h1 className="mt-1 text-lg font-semibold tracking-tight">{chat.title ?? 'Untitled chat'}</h1>
      </header>

      <ChatThread
        workspaceId={workspaceId}
        chatId={chatId}
        initialMessages={history.map((entry) => entry.payload)}
      />
    </div>
  );
}

function handleAsNotFound(error: unknown): never {
  if (error instanceof DomainErrors.NotFoundError || error instanceof DomainErrors.AccessDeniedError) {
    notFound();
  }
  throw error;
}
