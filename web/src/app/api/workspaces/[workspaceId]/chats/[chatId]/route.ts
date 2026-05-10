import { NextRequest, NextResponse } from 'next/server';
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
// GET /api/workspaces/[workspaceId]/chats/[chatId]
// ========================================================

const GETParamsSchema = z.object({
  workspaceId: z.uuid('Workspace id must be a valid UUID.'),
  chatId: z.uuid('Chat id must be a valid UUID.'),
});

export type GetChatByIdRequestParams = z.infer<typeof GETParamsSchema>;

export type GetChatByIdResponseBody = ApiResponse<ChatSession>;

export const GET = withApiErrorHandler(
  async (
    _request: NextRequest,
    context: RouteContext<'/api/workspaces/[workspaceId]/chats/[chatId]'>,
  ) => {
    const { workspaceId, chatId } = GETParamsSchema.parse(await context.params);
    const principal = await getAuthenticatedPrincipal();

    const service = createChatsService();

    const chat = await service
      .getChatById({ chatId, workspaceId, principalId: principal.id })
      .catch((error) =>
        translateAccessDeniedToNotFoundAndThrow(error, `Could not find chat with id "${chatId}".`),
      );

    return toApiResponse(chat);
  },
);

// ========================================================
// PATCH /api/workspaces/[workspaceId]/chats/[chatId]
// ========================================================

const PATCHParamsSchema = z.object({
  workspaceId: z.uuid('Workspace id must be a valid UUID.'),
  chatId: z.uuid('Chat id must be a valid UUID.'),
});

const PATCHBodySchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Title cannot be empty.')
      .max(160, 'Title must be 160 characters or fewer.')
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update.',
  });

export type UpdateChatRequestParams = z.infer<typeof PATCHParamsSchema>;

export type UpdateChatRequestBody = z.infer<typeof PATCHBodySchema>;

export type UpdateChatResponseBody = ApiResponse<ChatSession>;

export const PATCH = withApiErrorHandler(
  async (
    request: NextRequest,
    context: RouteContext<'/api/workspaces/[workspaceId]/chats/[chatId]'>,
  ) => {
    const { workspaceId, chatId } = PATCHParamsSchema.parse(await context.params);
    const principal = await getAuthenticatedPrincipal();
    const updates = await parseJsonBody(request, PATCHBodySchema);

    const service = createChatsService();

    const chat = await service
      .updateChat({ chatId, workspaceId, principalId: principal.id, input: updates })
      .catch((error) =>
        translateAccessDeniedToNotFoundAndThrow(error, `Could not update chat with id "${chatId}".`),
      );

    return toApiResponse(chat);
  },
);

// ========================================================
// DELETE /api/workspaces/[workspaceId]/chats/[chatId]
// ========================================================

const DELETEParamsSchema = z.object({
  workspaceId: z.uuid('Workspace id must be a valid UUID.'),
  chatId: z.uuid('Chat id must be a valid UUID.'),
});

export type ArchiveChatRequestParams = z.infer<typeof DELETEParamsSchema>;

export const DELETE = withApiErrorHandler(
  async (
    _request: NextRequest,
    context: RouteContext<'/api/workspaces/[workspaceId]/chats/[chatId]'>,
  ) => {
    const { workspaceId, chatId } = DELETEParamsSchema.parse(await context.params);
    const principal = await getAuthenticatedPrincipal();

    const service = createChatsService();

    await service
      .archiveChat({ chatId, workspaceId, principalId: principal.id })
      .catch((error) =>
        translateAccessDeniedToNotFoundAndThrow(error, `Could not find chat with id "${chatId}".`),
      );

    return new NextResponse(null, { status: 204 });
  },
);

function createChatsService() {
  const db = getDb();
  return new ChatsService(new DrizzleChatRepository(db), new DrizzleWorkspacesRepository(db));
}
