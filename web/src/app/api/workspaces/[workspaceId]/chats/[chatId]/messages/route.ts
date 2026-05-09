import { NextRequest } from 'next/server';
import { convertToModelMessages, createIdGenerator, streamText, validateUIMessages } from 'ai';
import { z } from 'zod';
import { AppendMessageInput, ChatMessage } from '@domains/chats/repositories/chat-repository';
import { ChatsService } from '@domains/chats/services/chats-service';
import { getDb } from '@infrastructure/db/get-db';
import { DrizzleChatRepository } from '@infrastructure/repositories/chats/drizzle-chat-repository';
import { DrizzleWorkspacesRepository } from '@infrastructure/repositories/workspaces/drizzle-workspaces-repository';
import { ApiErrors } from '@web/lib/errors';
import { getChatModel } from '@web/lib/chat/model';
import { getSystemPrompt } from '@web/lib/chat/system-prompt';
import { buildChatTools, ChatToolSet } from '@web/lib/chat/tools';
import type { ChatMessagePayload } from '@web/lib/chat/types';
import { getAuthenticatedPrincipal } from '@web/lib/utils/api/auth';
import {
  logError,
  translateAccessDeniedToNotFound,
  withApiErrorHandler,
} from '@web/lib/utils/api/errors';
import { parseJsonBody } from '@web/lib/utils/api/request';
import { ApiResponse, toApiResponse } from '@web/lib/utils/api/response';
import { WorkspacesService } from '@domains/workspaces/services/workspaces-service';

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

    const { chatsService } = createServices();

    const messages = await chatsService
      .loadChatMessages({ chatId, workspaceId, principalId: principal.id })
      .catch((error) =>
        translateAccessDeniedToNotFound(error, `Could not find chat with id "${chatId}".`),
      );

    return toApiResponse(messages);
  },
);

// ========================================================
// POST /api/workspaces/[workspaceId]/chats/[chatId]/messages
// ========================================================

const POSTParamsSchema = z.object({
  workspaceId: z.uuid('Workspace id must be a valid UUID.'),
  chatId: z.uuid('Chat id must be a valid UUID.'),
});

// We rely on the AI SDK's `validateUIMessages` for deep validation; this Zod
// schema only enforces the request envelope shape produced by the client's
// `DefaultChatTransport({ prepareSendMessagesRequest })` configuration, which
// sends only the latest message on the wire.
const POSTBodySchema = z.object({
  message: z.unknown(),
});

const messageIdGenerator = createIdGenerator({ prefix: 'msg_', size: 16 });

export const POST = withApiErrorHandler(
  async (
    request: NextRequest,
    context: RouteContext<'/api/workspaces/[workspaceId]/chats/[chatId]/messages'>,
  ) => {
    const { workspaceId, chatId } = POSTParamsSchema.parse(await context.params);
    const principal = await getAuthenticatedPrincipal();
    const { message } = await parseJsonBody(request, POSTBodySchema);

    const { chatsService, workspacesService } = createServices();

    const history = await chatsService
      .loadChatMessages({ chatId, workspaceId, principalId: principal.id })
      .catch((error) =>
        translateAccessDeniedToNotFound(error, `Could not find chat with id "${chatId}".`),
      );

    // The workspaces repo is threaded into tools so `getWorkspaceContext` can
    // load workspace details lazily — only when the model actually asks. We
    // deliberately do not eager-load the workspace here; that would charge
    // every request for context most turns don't need.
    const tools = buildChatTools({ workspaceId, workspacesService });

    const { uiMessages, modelMessages } = await parseMessages(
      [...history.map((entry) => entry.payload), message],
      tools,
    );

    const result = streamText({
      model: getChatModel(),
      system: getSystemPrompt(),
      messages: modelMessages,
      tools,
    });

    // Force the stream to finish even if the client disconnects, so `onFinish`
    // still runs and we persist the final exchange. Intentionally not awaited.
    void result.consumeStream();

    return result.toUIMessageStreamResponse<ChatMessagePayload>({
      originalMessages: uiMessages,
      generateMessageId: messageIdGenerator,
      onFinish: async ({ messages }) => {
        // Persist on every finish — including aborts — so a disconnected
        // assistant turn still lands in the DB. Idempotency is handled by
        // `DrizzleChatRepository.appendMessages` via `onConflictDoNothing` on
        // the AI-SDK-stable message id, so re-running with the full message
        // list (history + new) is safe.
        try {
          const inputs = messages.map(toAppendMessageInput);
          await chatsService.appendMessages({
            chatId,
            workspaceId,
            principalId: principal.id,
            messages: inputs,
          });
        } catch (error) {
          // Persistence failures are logged but not surfaced — the user has
          // already received the streamed response and re-throwing here would
          // close the SSE stream with an opaque error.
          logError(error);
        }
      },
    });
  },
);

// ------------------------------------------------------------
// Helper functions
// ------------------------------------------------------------

function toAppendMessageInput(message: ChatMessagePayload): AppendMessageInput {
  return {
    id: message.id,
    role: message.role,
    payload: message,
  };
}

function createServices(db = getDb()) {
  const workspacesRepo = new DrizzleWorkspacesRepository(db);

  return {
    chatsService: new ChatsService(new DrizzleChatRepository(db), workspacesRepo),
    workspacesService: new WorkspacesService(workspacesRepo),
  };
}

async function parseMessages(messages: unknown[], tools: ChatToolSet) {
  let uiMessages: ChatMessagePayload[];
  try {
    uiMessages = await validateUIMessages<ChatMessagePayload>({
      messages,
      tools,
    });
  } catch (cause) {
    throw new ApiErrors.BadRequestError('Invalid chat message payload.', {
      info: { cause: cause instanceof Error ? cause.message : String(cause) },
    });
  }

  return {
    uiMessages,
    modelMessages: await convertToModelMessages(uiMessages, { tools }),
  };
}
