import { NextRequest } from 'next/server';
import { z } from 'zod';

import { ChatMessage } from '@domains/chats/repositories/chat-repository';
import { ChatsService } from '@domains/chats/services/chats-service';
import { getDb } from '@infrastructure/db/get-db';
import { DrizzleChatRepository } from '@infrastructure/repositories/chats/drizzle-chat-repository';
import { DrizzleWorkspacesRepository } from '@infrastructure/repositories/workspaces/drizzle-workspaces-repository';
import { getAuthenticatedPrincipal } from '@web/lib/utils/api/auth';
import { translateAccessDeniedToNotFound, withApiErrorHandler } from '@web/lib/utils/api/errors';
import { ApiResponse, toApiResponse } from '@web/lib/utils/api/response';

// ========================================================
// GET /api/workspaces/[workspaceId]/chats/[chatId]/messages
// ========================================================

const GETParamsSchema = z.object({
  workspaceId: z.uuid('Workspace id must be a valid UUID.'),
  chatId: z.uuid('Chat id must be a valid UUID.'),
});

export type ListChatMessagesRequestParams = z.infer<typeof GETParamsSchema>;

export type ListChatMessagesResponseBody = ApiResponse<ChatMessage[]>;

export const GET = withApiErrorHandler(
  async (
    _request: NextRequest,
    context: RouteContext<'/api/workspaces/[workspaceId]/chats/[chatId]/messages'>,
  ) => {
    const { workspaceId, chatId } = GETParamsSchema.parse(await context.params);
    const principal = await getAuthenticatedPrincipal();

    const service = createChatsService();

    const messages = await service
      .loadChatMessages({ chatId, workspaceId, principalId: principal.id })
      .catch((error) =>
        translateAccessDeniedToNotFound(error, `Could not find chat with id "${chatId}".`),
      );

    return toApiResponse(messages);
  },
);

function createChatsService() {
  const db = getDb();
  return new ChatsService(new DrizzleChatRepository(db), new DrizzleWorkspacesRepository(db));
}
