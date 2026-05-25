import { NextRequest } from 'next/server';
import { z } from 'zod';

import { Chat } from '@domains/chats/entities/chat-session';
import { ChatsService } from '@domains/chats/services/chats-service';
import { getDb } from '@infrastructure/db/get-db';
import { DrizzleChatRepository } from '@infrastructure/repositories/chats/drizzle-chat-repository';
import { DrizzleWorkspacesRepository } from '@infrastructure/repositories/workspaces/drizzle-workspaces-repository';
import { getAuthenticatedPrincipal } from '@/lib/utils/api/auth';
import { translateAccessDeniedToNotFoundAndThrow, withApiErrorHandler } from '@/lib/utils/api/errors';
import { ApiResponse, toApiResponse } from '@/lib/utils/api/response';

const RouteParamsSchema = z.object({
  workspaceId: z.uuid('Workspace id must be a valid UUID.'),
});

// ========================================================
// GET /api/workspaces/[workspaceId]/chats
// ========================================================

export type ListChatsRequestParams = z.infer<typeof RouteParamsSchema>;

export type ListChatsResponseBody = ApiResponse<Chat[]>;

export const GET = withApiErrorHandler(
  async (_request: NextRequest, context: RouteContext<'/api/workspaces/[workspaceId]/chats'>) => {
    const { workspaceId } = RouteParamsSchema.parse(await context.params);
    const principal = await getAuthenticatedPrincipal();

    const service = createChatsService();

    const chats = await service
      .listChats({ workspaceId, principalId: principal.id })
      .catch((error) =>
        translateAccessDeniedToNotFoundAndThrow(
          error,
          `Could not find workspace with id "${workspaceId}".`,
        ),
      );

    return toApiResponse(chats);
  },
);

function createChatsService() {
  const db = getDb();
  return new ChatsService(new DrizzleChatRepository(db), new DrizzleWorkspacesRepository(db));
}
