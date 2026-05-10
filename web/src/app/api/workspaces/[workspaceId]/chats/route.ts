import { NextRequest } from 'next/server';
import { z } from 'zod';

import { ChatSession } from '@domains/chats/entities/chat-session';
import { ChatsService } from '@domains/chats/services/chats-service';
import { getDb } from '@infrastructure/db/get-db';
import { DrizzleChatRepository } from '@infrastructure/repositories/chats/drizzle-chat-repository';
import { DrizzleWorkspacesRepository } from '@infrastructure/repositories/workspaces/drizzle-workspaces-repository';
import { getAuthenticatedPrincipal } from '@web/lib/utils/api/auth';
import { translateAccessDeniedToNotFoundAndThrow, withApiErrorHandler } from '@web/lib/utils/api/errors';
import { parseJsonBody } from '@web/lib/utils/api/request';
import { ApiResponse, toApiResponse } from '@web/lib/utils/api/response';

// ========================================================
// POST /api/workspaces/[workspaceId]/chats
// ========================================================

const POSTParamsSchema = z.object({
  workspaceId: z.uuid('Workspace id must be a valid UUID.'),
});

const POSTBodySchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title cannot be empty.')
    .max(160, 'Title must be 160 characters or fewer.')
    .optional(),
});

export type CreateChatRequestParams = z.infer<typeof POSTParamsSchema>;

export type CreateChatRequestBody = z.infer<typeof POSTBodySchema>;

export type CreateChatResponseBody = ApiResponse<ChatSession>;

export const POST = withApiErrorHandler(
  async (request: NextRequest, context: RouteContext<'/api/workspaces/[workspaceId]/chats'>) => {
    const { workspaceId } = POSTParamsSchema.parse(await context.params);
    const principal = await getAuthenticatedPrincipal();
    const { title } = await parseJsonBody(request, POSTBodySchema);

    const service = createChatsService();

    const chat = await service
      .createChat({ workspaceId, principalId: principal.id, title })
      .catch((error) =>
        translateAccessDeniedToNotFoundAndThrow(
          error,
          `Could not find workspace with id "${workspaceId}".`,
        ),
      );

    return toApiResponse(chat, { responseInit: { status: 201 } });
  },
);

// ========================================================
// GET /api/workspaces/[workspaceId]/chats
// ========================================================

const GETParamsSchema = z.object({
  workspaceId: z.uuid('Workspace id must be a valid UUID.'),
});

export type ListChatsRequestParams = z.infer<typeof GETParamsSchema>;

export type ListChatsResponseBody = ApiResponse<ChatSession[]>;

export const GET = withApiErrorHandler(
  async (_request: NextRequest, context: RouteContext<'/api/workspaces/[workspaceId]/chats'>) => {
    const { workspaceId } = GETParamsSchema.parse(await context.params);
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
