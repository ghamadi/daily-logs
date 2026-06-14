import { after, NextRequest } from 'next/server';
import {
  consumeStream,
  createUIMessageStream,
  createUIMessageStreamResponse,
  smoothStream,
  stepCountIs,
  streamText,
} from 'ai';
import { z } from 'zod';

import { ChatMessage, ChatsService } from '@daily-logs/domains/chats';
import { DrizzleChatRepository } from '@infrastructure/repositories/chats/drizzle-chat-repository';

import { getDb } from '@infrastructure/db/get-db';
import { DrizzleWorkspacesRepository } from '@infrastructure/repositories/workspaces/drizzle-workspaces-repository';
import { getChatModel } from '@/lib/ai-sdk/model';
import { getSystemPrompt } from '@/lib/ai-sdk/system-prompt';
import type { UIMessage } from 'ai';
import { getAuthenticatedPrincipal } from '@/lib/utils/api/auth';
import {
  translateAccessDeniedToNotFoundAndThrow as mapAccessDeniedToNotFoundAndThrow,
  withApiErrorHandler,
} from '@/lib/utils/api/errors';
import { parseJsonBody } from '@/lib/utils/api/request';
import { ApiResponse, toApiResponse } from '@/lib/utils/api/response';
import { buildPrepareConversationUseCase } from '@/lib/application/chat/use-cases/prepare-conversation-factory';
import { buildChronicleTools } from '@/lib/ai-sdk/tools/chronicle-tools';
import { ToolsRuntime } from '@/lib/ai-sdk/tools/tools-runtime';
import { ChronicleMessagePayload } from '@/lib/ai-sdk/chronicle/types';
import { generateMessageId, logAndExtractAiGenerationErrorMessage } from '@/lib/ai-sdk/helpers';
import { buildSaveMessagesUseCase } from '@/lib/application/chat/use-cases/save-messages-factory';

export const maxDuration = 60;

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

    const chatsService = createChatService();

    const messages = await chatsService
      .loadChatMessages({ chatId, workspaceId, principalId: principal.id })
      .catch((error) =>
        mapAccessDeniedToNotFoundAndThrow(error, `Could not find chat with id "${chatId}".`),
      );

    // Heal-on-read: hide zombie rows persisted from a failed stream (e.g. an
    // assistant turn that 403'd before any parts were emitted). They would
    // otherwise render as blank bubbles and break `validateUIMessages` the
    // next time the chat sends a message.
    return toApiResponse(messages.filter(messageHasContent));
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

export type SendChatMessageRequestBody = z.infer<typeof POSTBodySchema>;

export const POST = withApiErrorHandler(
  async (
    request: NextRequest,
    context: RouteContext<'/api/workspaces/[workspaceId]/chats/[chatId]/messages'>,
  ) => {
    const { workspaceId, chatId } = POSTParamsSchema.parse(await context.params);
    const chatsService = createChatService();

    const [principal, { message }] = await Promise.all([
      getAuthenticatedPrincipal(),
      parseJsonBody(request, POSTBodySchema),
    ]);

    // Keep the route handler alive until the DB write settles, in case the client disconnects early.
    const dataPersistence = Promise.withResolvers<void>();
    after(dataPersistence.promise);

    // ------------------------------------------------------------
    // Prepare dependencies and construct use cases
    // ------------------------------------------------------------
    const toolsRuntime = new ToolsRuntime();
    const chronicleTools = buildChronicleTools({
      chatId,
      workspaceId,
      principalId: principal.id,
      runtime: toolsRuntime,
    });
    const saveMessagesUseCase = buildSaveMessagesUseCase(chatsService);
    const prepareConversationUseCase = buildPrepareConversationUseCase(chatsService, chronicleTools);

    // --------------------------------------------------------------------------
    // Prepare the conversation
    // (throws if the chat is not found or the user does not have access to it)
    // --------------------------------------------------------------------------
    const conversation = await prepareConversationUseCase({
      workspaceId,
      chatId,
      principalId: principal.id,
      message,
    });

    // --------------------------------------------------------------------------
    // Create the stream
    // --------------------------------------------------------------------------
    const stream = createUIMessageStream<ChronicleMessagePayload>({
      originalMessages: conversation.uiMessages,
      generateId: generateMessageId,
      onFinish: async ({ messages }) => {
        await saveMessagesUseCase({
          chatId,
          workspaceId,
          principalId: principal.id,
          messages,
          discardedMessageIds: conversation.discardedMessageIds,
        });
        dataPersistence.resolve();
      },
      onError: (error) => {
        dataPersistence.resolve();
        return logAndExtractAiGenerationErrorMessage(error);
      },
      execute: async ({ writer }) => {
        // Register the stream's writer so that tools can write to it at runtime
        toolsRuntime.registerWriter(writer);

        // Configure LLM generation (streamText is lazy — no streaming until consumed)
        const streamTextResult = streamText({
          model: getChatModel(),
          system: getSystemPrompt(),
          messages: conversation.modelMessages,
          tools: chronicleTools,
          stopWhen: stepCountIs(5),
          experimental_transform: smoothStream({
            chunking: 'word',
            delayInMs: 30,
          }),
        });

        // Translate model output to UI events and pipe into the outer stream
        writer.merge(
          streamTextResult.toUIMessageStream({
            sendReasoning: true,
            onError: logAndExtractAiGenerationErrorMessage,
          }),
        );
      },
    });

    // Return an SSE response to the client and drain a tee'd copy of the stream using `consumeStream`
    // so generation and onFinish persistence complete even if the client disconnects.
    return createUIMessageStreamResponse({
      stream,
      consumeSseStream: consumeStream,
    });
  },
);

// ------------------------------------------------------------
// Helper functions
// ------------------------------------------------------------

function createChatService(db = getDb()) {
  const workspacesRepo = new DrizzleWorkspacesRepository(db);
  return new ChatsService(new DrizzleChatRepository(db), workspacesRepo);
}

// A persisted `ChatMessage` whose UIMessage payload has at least one part.
// Empty-parts payloads are artifacts of upstream stream failures (see the
// `onFinish` handler above) and must not be fed to `validateUIMessages` —
// the AI SDK's UIMessage schema requires `parts.length >= 1`.
function messageHasContent(entry: ChatMessage): boolean {
  return uiMessageHasContent(entry.payload);
}

function uiMessageHasContent(message: UIMessage): boolean {
  return Array.isArray(message.parts) && message.parts.length > 0;
}
