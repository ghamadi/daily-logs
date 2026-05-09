# Workspace Backend + Workspace-Scoped Private Chat Plan

## Summary

- Workspace backend with authenticated API route handlers.
- Workspace-scoped, owner-private chat sessions and AI SDK v6 streaming chat with one starter tool.
- Minimal protected UI to exercise the chat end-to-end.
- Tests are deferred to a later pass to keep momentum on shipping the feature. When added, they will be colocated next to the code they exercise (e.g. `route.test.ts` next to `route.ts`), with `web/next.config.ts` `pageExtensions` excluding `.test.{ts,tsx}` and `.cursor/rules/project-overview.mdc` updated to match.
- Build top-down: start at the route handler, then add only the service/repository methods the route actually needs.

## Current Status

- **Step 1 — Workspace API Routes**: ✅ done (single-owner scope; member management subroutes deferred).
- **Step 2 — Chat Persistence**: ✅ done.
- **Step 3 — Chat API + AI SDK v6**: ✅ done.
- **Step 4 — Minimal AI Elements UI**: ✅ done. The plan is complete; remaining work lives under "Deferred to a Later Pass" below.

A fresh agent landing here should read this whole document plus `.cursor/rules/project-overview.mdc` (project intent, monorepo structure, API URL conventions in section 6) before picking from the deferred list or starting a new feature.

## Key Design Decisions (decided; do not relitigate)

These decisions came out of discussion during steps 1–3. They constrain how Step 4 — and any later evolution — is allowed to look.

### Routing

- **API URLs flatten under the workspace, max two ID segments.** See `.cursor/rules/project-overview.mdc` § 6. The dynamic param is `[workspaceId]` (not `[id]`); chat-bound subresources are `[chatId]`. Sub-collections under a chat (e.g. `messages`) live behind a static path segment, never a third id.

### Workspace boundary enforcement

- The chat session row is the source of truth for `workspaceId`. The service rejects any request whose URL `[workspaceId]` does not equal the loaded chat's stored `workspaceId`. Mismatches surface as `NotFoundError` (404), never as "forbidden", to avoid confirming cross-workspace existence to unauthorised callers (`ChatsService.requireOwnedChat`).
- API routes additionally translate `AccessDeniedError` to `NotFoundError` at the boundary for `GET`/`PATCH`/`DELETE` on individual resources, via `translateAccessDeniedToNotFound`. Same privacy reason.

### Tool security model

- Security-trusted values (`workspaceId`, `principalId`) are **never** in tool `inputSchema`. They live in the closure of `buildChatTools(...)` and inside `execute` reach data via the bound context only. The model can neither see nor influence them.
- `experimental_context` (the SDK alternative) is functionally equivalent for security but type-loose (`unknown`). Closure was picked for explicit typing; do not switch without a reason.
- Tools fetch on-demand. Per-request workspace data (name, members, recent activity) belongs in tool outputs, **not** in the system prompt — see "Prompt vs tool" below.

### Prompt vs tool (system prompt design)

- The system prompt carries only data with **no DB cost**: framing, behavioural rules, and `serverTime` (free, universally useful for date math).
- Anything that requires a DB read (workspace name, member counts, etc.) is exposed as a tool the model calls when it actually needs it. Eager-loading those facts on every request is rejected — most turns don't reference them, and the system prompt grows linearly with every new context fact.
- The system prompt resists embedded prompt injection in tool results / pasted content (explicitly enumerated as a behavioural rule).

### Persistence model

- `chat_messages.payload` stores the raw AI SDK v6 `UIMessage` JSON. We do not persist `ModelMessage`s.
- `chat_messages.id` is the AI-SDK-stable id (`varchar(64)`). Idempotent inserts via `onConflictDoNothing` on this column — `onFinish` can re-run with the full message list and only new rows land.
- **Soft archive only.** `archived_at` makes a chat inaccessible via the chat APIs. Hard delete is deferred until sharing/cleanup semantics exist. FK cascades handle user/workspace deletion.
- **Workspace-membership removal does not touch chats.** Owners who lose membership lose API access to their chats but the rows persist. Future cron-based cleanup is acceptable; today's chat APIs are the gate.

### Repository / service conventions

- `createdAt` and `updatedAt` are managed by the repository (DB `defaultNow()` for create, `new Date()` in the repo for updates). Services cannot pass them. Currently applied consistently in `DrizzleChatRepository`.
- Domain entity name is `ChatSession` and the table is `chat_sessions` (avoids migration churn). Repository / service / API surface uses `chat`/`chatId` (e.g. `createChat`, `findChatById`, `loadChatMessages`).

### AI SDK v6 wire contract

- The client must use `DefaultChatTransport({ prepareSendMessagesRequest: ({ messages }) => ({ body: { message: messages.at(-1) } }) })`. The server expects `{ message: UIMessage }` and rebuilds history from the DB. A client sending the default `{ id, messages }` shape gets a 400.
- `result.consumeStream()` is called (not awaited) before returning so `onFinish` always fires, including on client disconnect.
- Assistant message ids come from a module-scoped `createIdGenerator({ prefix: 'msg', size: 16 })` so persisted ids fit in `varchar(64)` and are stable across retries.

## Implementation Steps

### 1. Workspace API Routes — ✅ done

Implemented routes (all under `web/src/app/api/workspaces/`):

- `POST /api/workspaces` and `GET /api/workspaces` → `web/src/app/api/workspaces/route.ts`.
- `GET / PATCH / DELETE /api/workspaces/[workspaceId]` → `web/src/app/api/workspaces/[workspaceId]/route.ts`.
- `GET / POST /api/workspaces/[workspaceId]/members` → `web/src/app/api/workspaces/[workspaceId]/members/route.ts`. (Member subroute work past `GET`/`POST` is deferred.)

Supporting infrastructure in place:

- `withApiErrorHandler` HOF in `web/src/lib/utils/api/errors.ts` mapping `DomainError` subclasses → `ApiError` (`AccessDeniedError → 403`, `NotFoundError → 404`, `InvalidInputError → 400`, others → 500). Includes `translateAccessDeniedToNotFound` for the privacy translation.
- API error subclasses under `web/src/lib/errors/` (`NotFoundError`, `BadRequestError`, etc.) and a barrel `ApiErrors`.
- Domain error subclasses under `domains/src/lib/errors/` and a barrel `DomainErrors`.
- Shared route helpers: `parseJsonBody` (`web/src/lib/utils/api/request.ts`) and `toApiResponse` (`web/src/lib/utils/api/response.ts`).
- `getAuthenticatedPrincipal()` in `web/src/lib/utils/api/auth.ts` returns the domain `User`.
- `WorkspacesService.listForUser` was added top-down for `GET /api/workspaces`.

### 2. Chat Persistence — ✅ done

Schema (in `db/src/schema/tables/`):

- `chat_sessions`: `id uuid pk`, `workspace_id uuid fk → workspaces (cascade)`, `owner_user_id uuid fk → users (cascade)`, `title varchar(160)`, `created_at`, `updated_at`, `archived_at`. Index on `(workspace_id, owner_user_id, updated_at)`.
- `chat_messages`: `id varchar(64) pk` (AI-SDK ids), `session_id uuid fk → chat_sessions (cascade)`, `role chat_message_role` (Postgres enum: `'user' | 'assistant' | 'system'`), `payload jsonb` typed as `ChatMessagePayload` (the AI SDK v6 `UIMessage`), `created_at`, `updated_at`. Index on `(session_id, created_at)`.

Domain layer (`domains/src/chats/`):

- `ChatSession` entity with `isArchived` and `isOwnedBy`.
- `ChatMessageRole` value object mirroring the DB enum.
- `IChatRepository` with `createChat`, `findChatById`, `listOwnerChats`, `updateChat`, `archiveChat`, `loadMessages`, `appendMessages` (idempotent).
- `ChatsService` with workspace-membership and chat-ownership enforcement (see "Workspace boundary enforcement" above). `appendMessages` accepts a `messages: AppendMessageInput[]` (where `id` is AI-SDK-stable).

Infrastructure (`infrastructure/src/repositories/chats/drizzle-chat-repository.ts`):

- `appendMessages` does staggered timestamps within a batch (`+i ms`) to preserve intra-batch order despite Postgres resolving `now()` once per transaction.
- `appendMessages` uses `onConflictDoNothing({ target: ChatMessagesTable.id })` for idempotent retries.

Migrations: a single migration regenerated from scratch (`db/drizzle/0000_*.sql`). Resetting `db/drizzle/` and regenerating is the project's pre-deploy convention; first persistent migration is added once we have real users.

### 3. Chat API + AI SDK v6 — ✅ done

Dependencies installed in `web/`:

- `ai@^6` and `@ai-sdk/react@^3` (Vercel AI Gateway is re-exported from `'ai'`; no separate `@ai-sdk/gateway` package).
- Runtime requires `AI_GATEWAY_API_KEY` to be set in the environment.

Routes (all under `web/src/app/api/workspaces/[workspaceId]/`):

- `POST /chats` and `GET /chats` → `chats/route.ts`.
- `GET / PATCH / DELETE /chats/[chatId]` → `chats/[chatId]/route.ts`.
- `GET /chats/[chatId]/messages` (history) and `POST /chats/[chatId]/messages` (streaming) → `chats/[chatId]/messages/route.ts`.

Streaming POST internals (`web/src/app/api/workspaces/[workspaceId]/chats/[chatId]/messages/route.ts`):

1. Parse `{ workspaceId, chatId }` from params; auth principal; parse body `{ message: unknown }`.
2. `chatsService.loadChatMessages(...)` enforces auth + workspace-match + ownership and returns history.
3. `buildChatTools({ workspaceId, workspacesService })` builds a fresh per-request tool registry closing over server-trusted values.
4. `parseMessages(...)` runs `validateUIMessages([...history.payloads, message], tools)` (catches drift in historic tool-call parts), then `convertToModelMessages` to produce model-shaped messages. Validation errors map to `BadRequestError` (400).
5. `streamText({ model: getChatModel(), system: getSystemPrompt(), messages, tools })`.
6. `void result.consumeStream()` (not awaited) so the producer drains regardless of client read state.
7. `result.toUIMessageStreamResponse({ originalMessages: uiMessages, generateMessageId, onFinish })`. `onFinish` calls `chatsService.appendMessages(...)` with the full updated list. The repo's `onConflictDoNothing` handles idempotency. Persistence failures are logged via `logError` and swallowed (they would otherwise close the SSE stream with an opaque error after the user has already seen the response).

Chat library (`web/src/lib/chat/`):

- `model.ts` → `getChatModel()` returning `gateway('openai/gpt-4o-mini')`. Single swap point; `'ai/test'` `MockLanguageModelV2` will replace this when tests land.
- `tools.ts` → `ChatToolContext`, `buildChatTools(ctx)`, exported `ChatToolSet` and `ChatTools` (= `InferUITools<ChatToolSet>`) so persisted UIMessages are typed end-to-end. One tool today: `getWorkspaceContext` (input `{}`, output `{ name }`, lazily fetched via `WorkspacesService.findById`).
- `system-prompt.ts` → `getSystemPrompt({ now? })`. Generic across workspaces; carries `serverTime` only. Mentions tool-driven workspace-detail lookup explicitly.
- `types.ts` → `ChatMessagePayload = UIMessage<unknown, never, ChatTools>`.

Cross-package: `eslint.config.mjs` was updated to allow `import type` from `web` into `db` and `domains` (the persisted `UIMessage` type lives in `web/src/lib/chat/types.ts` and is referenced as a type from the db schema and the chat repo interface).

### 4. Minimal AI Elements UI — ✅ done

Thin protected UI to exercise the streaming chat end-to-end. No UI tests; no theming polish; no member management. Single-owner workspaces only. AI Elements components were intentionally **not** pulled in — a small in-house switch over `UIMessage.parts` was enough for the demo and avoided an extra dep.

Pages (all under `web/src/app/(protected)/`):

- `layout.tsx` → minimal app chrome (header with home link) and the `#dialog-root` portal target the existing `Dialog` component expects.
- `page.tsx` → `redirect('/workspaces')` so `/` is a single jumping-off point.
- `workspaces/page.tsx` → server component listing the principal's workspaces via `WorkspacesService.listWorkspacesForUser`. Empty state + a `CreateWorkspaceDialog` trigger.
- `workspaces/_components/create-workspace-dialog.tsx` → client component using the existing `Dialog` primitive; `POST /api/workspaces` then `router.refresh()`.
- `workspaces/[workspaceId]/page.tsx` → loads the workspace + non-archived chats in parallel through the services, with `DomainErrors.{NotFoundError,AccessDeniedError}` translated to Next's `notFound()` so the URL never confirms cross-workspace existence (mirroring the API privacy translation).
- `workspaces/[workspaceId]/_components/new-chat-button.tsx` → `POST /api/workspaces/[workspaceId]/chats` with empty body, then `router.push` to the new chat.
- `workspaces/[workspaceId]/chats/[chatId]/page.tsx` → loads chat metadata + history through `ChatsService.getChatById` / `loadChatMessages`, hands `payload`s as `initialMessages` to the client thread.

Read paths are intentionally service-direct rather than HTTP-fetched from the API. The auth/membership/ownership guards live in the service layer (`ChatsService.requireOwnedChat` etc.), so calling services directly avoids cookie-forwarding ceremony without weakening the contract. The deeper privacy translation (`AccessDenied → 404`) is done in each page via a local `handleAsNotFound` helper.

Write paths go through the API (`fetch` from client components) so the API contracts stay exercised end-to-end.

Chat library (`web/src/lib/chat/`):

- `transport.ts` → `createChatTransport({ workspaceId, chatId })` returns a `DefaultChatTransport<ChatMessagePayload>` with the contract-mandatory `prepareSendMessagesRequest: ({ messages }) => ({ body: { message: messages.at(-1) } })`. Without this override the server returns 400.
- `components/chat-thread.tsx` → single client component combining the message list and composer:
  - `useChat<ChatMessagePayload>({ id: chatId, transport, messages: initialMessages })` from `@ai-sdk/react`.
  - Renders one bubble per message; walks `message.parts` and switches on `part.type` for `text`, `reasoning`, `step-start` (skipped), and tool parts (via `isToolUIPart` + `getToolName` from `'ai'`). Each tool part shows its name, current state, and pretty-printed input/output (or `errorText` on `'output-error'`).
  - Composer: `<textarea>` + send button. Enter sends, Shift+Enter inserts a newline. While `status` is `'submitted' | 'streaming'` the send button swaps for a stop button bound to `useChat().stop`. Errors surface in a dismissible banner driven by `error` / `clearError`.

Manual verification flow: log in → `/workspaces` (auto-redirect) → create workspace → create chat → send "what workspace am I in?" → assistant calls `getWorkspaceContext`, the call + result render inline, response streams back → reload the chat page → history is intact (rehydrated from `chat_messages.payload`).

## Final Validation (this pass)

- `pnpm lint`
- `pnpm format:check`
- Manual smoke through the protected UI: create workspace, create chat, send message, reload to confirm persistence, ask _"what workspace am I in?"_ to trigger the `getWorkspaceContext` tool and confirm the rendered tool call + result.

## Deferred to a Later Pass

- **Workspace member management routes:** `GET` and `POST` on `/api/workspaces/[workspaceId]/members` are implemented. `PATCH /api/workspaces/[workspaceId]/members/[memberId]`, `DELETE /api/workspaces/[workspaceId]/members/[memberId]`, and `DELETE /api/workspaces/[workspaceId]/members/me` (leave) are deferred until invitations / member UX are designed. Repository, service, and `IWorkspacesRepository` surface for these ops are already in place. Until then, all downstream features assume single-owner workspaces.
- **Test foundation:** move Vitest/shared DB helpers from `infrastructure/test` to root `test/` (helpers, setup, scripts), add a root `vitest.config.ts` with package aliases for `@db`, `@domains`, `@infrastructure`, `@web`, `@utils`, configure `web/next.config.ts` `pageExtensions` to exclude `.test.{ts,tsx}` so colocated route tests are not treated as Next entries, and update `.cursor/rules/project-overview.mdc` section 4 to reflect colocated tests.
- **Workspace route integration tests** colocated as `route.test.ts` next to each `route.ts`, covering: auth required, non-member denial, member read access, admin/owner member management, owner-only update/delete, owner immutability, duplicate membership.
- **Chat route integration tests** covering: workspace membership required, owners only see their own chats inside a workspace, users cannot read or post to another user's private chat, posting through a mismatched workspace URL is rejected, posting streams an assistant response and persists the final messages, dummy tool result is streamed and persisted, AI calls go through `'ai/test'` mocks rather than the real provider.
- **Hard delete** on chat sessions, once sharing/cleanup semantics are designed.
- **Chat cleanup on workspace-membership removal.** Decision: when a member is removed from a workspace, do **not** touch their chats — they simply become inaccessible via the chat APIs (see `ChatsService.requireOwnedChat`). FK cascades already handle the strong signals (user deleted → chats deleted; workspace deleted → chats deleted), so the only remaining concern is long-term storage of chats whose owner is no longer a workspace member. We'll address that, if needed, with a background job (e.g. archive/hard-delete after N days of orphaned-by-membership state) once we actually have data and a real cleanup story.
- **Repository-managed timestamps elsewhere.** Currently only `DrizzleChatRepository` follows the "service can't pass `createdAt`/`updatedAt`" convention. Other repos still allow them. Worth aligning when next touching those files; not worth a dedicated pass.
- **Stable client-side message ids.** `useChat` generates user-message ids client-side with the SDK default. If we ever need cross-device replay or stricter idempotency, set `generateId` on the `useChat`/`DefaultChatTransport` configuration and document the contract.
- **Richer chat UI.** Markdown rendering, code blocks, copy-to-clipboard, message editing, regenerate, smarter "stick to bottom" scroll, message-level error retry, etc. (A stop button is already wired against `useChat().stop`.)
- **In-app workspace / chat management UI.** No rename / archive / delete affordances in the UI yet — the user can only create. The corresponding API routes (`PATCH` / `DELETE` on workspaces and chats) already exist; they just have no UI surface. Member management UI is also pending.
- **Pagination.** Workspaces list, chats list, and chat history are all loaded in full per page. Fine for the demo; needs cursoring once we have real volume.

## Assumptions

- Tests are deliberately deferred for this pass; when added, they will be colocated with the code they exercise and discovered from a root Vitest config.
- "Private to owner" means no workspace member except the owner can see a session until sharing exists.
- If the owner loses workspace membership, the chat becomes inaccessible through workspace chat APIs but is **not** deleted; the rows persist until the user or workspace itself is deleted, or until a future background job decides to clean them up.
- Tools operate only within the chat session's workspace, never from URL params, request body, or model-supplied workspace ids.
- AI Gateway (imported from `'ai'`) is the real provider path; future tests will swap it for an `MockLanguageModelV2` from `'ai/test'` via the model factory.
- `AI_GATEWAY_API_KEY` is provided by the runtime environment (Vercel project env, local `.env.local`). We do not wire a `.env.example` yet because we have no other AI-specific env vars worth grouping.
