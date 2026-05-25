import { notFound } from 'next/navigation';
import { ChatsService } from '@domains/chats/services/chats-service';
import { DomainErrors } from '@domains/lib/errors';
import { getDb } from '@infrastructure/db/get-db';
import { DrizzleChatRepository } from '@infrastructure/repositories/chats/drizzle-chat-repository';
import { DrizzleWorkspacesRepository } from '@infrastructure/repositories/workspaces/drizzle-workspaces-repository';
import { ChatThread } from '@/app/(protected)/workspaces/[workspaceId]/chats/_components/chat-thread';
import { getAuthenticatedPrincipal } from '@/lib/utils/api/auth';

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
  const [_chat, history] = await Promise.all([
    chatsService.getChatById({ chatId, workspaceId, principalId: principal.id }).catch(handleAsNotFound),
    chatsService
      .loadChatMessages({ chatId, workspaceId, principalId: principal.id })
      .catch(handleAsNotFound),
  ]);

  return (
    <ChatThread
      workspaceId={workspaceId}
      chatId={chatId}
      initialMessages={history.map((entry) => entry.payload)}
    />
  );
}

function handleAsNotFound(error: unknown): never {
  if (error instanceof DomainErrors.NotFoundError || error instanceof DomainErrors.AccessDeniedError) {
    notFound();
  }
  throw error;
}
