# Workspace Backend + Workspace-Scoped Private Chat Plan

## Summary

- Finish workspace backend with authenticated API route handlers.
- Add workspace-scoped, owner-private chat sessions and AI SDK v6 streaming chat with one dummy tool.
- Add a minimal protected UI to exercise the chat end-to-end.
- Tests are deferred to a later pass to keep momentum on shipping the feature. When added, they will be colocated next to the code they exercise (e.g. `route.test.ts` next to `route.ts`), with `web/next.config.ts` `pageExtensions` excluding `.test.{ts,tsx}` and `.cursor/rules/project-overview.mdc` updated to match.
- Build top-down: start at the route handler, then add only the service/repository methods the route actually needs.

## Key Model Decisions

- `chat_sessions` belongs to both `workspace_id` and `owner_user_id`.
- Chat sessions live in workspaces but remain private to their owner until sharing exists.
- The owner must be a current workspace member to access or continue a chat.
- Tool execution uses the server-trusted session `workspaceId`; tools must not accept arbitrary workspace ids from model input.
- Sharing is deferred, but schema should allow adding `chat_session_shares` later.

## Implementation Order

1. **Workspace API Routes**
   - Port a `withApiErrorHandling` higher-order handler from the existing project into `web/src/lib/errors/` that maps `DomainError` subclasses to `ApiError` responses (`AccessDenied -> 403`, `EntityNotFound -> 404`, `InvalidInput -> 400` or `422`) and unexpected errors to a 500.
   - Add the missing `ApiError` subclasses needed for that mapping under `web/src/lib/errors/api-errors/`: `NotFoundError` and `BadRequestError` (or `UnprocessableEntityError`). Existing today: `UnauthorizedError`, `ForbiddenError`.
   - Add shared route helpers for JSON responses and Zod request validation. `getAuthenticatedPrincipal()` already exists in `web/src/lib/utils/api/auth.ts` and returns the domain `User`.
   - Add workspace route handlers for create/list/get/update/delete. Member management routes (list/add/update/remove/leave) are deferred — see "Deferred to a Later Pass" — and the immediate slice operates on workspaces with only their owner as a member.
   - Keep authorization in `WorkspacesService`; routes authenticate, validate, call service, and serialize.
   - Add service/repository methods only when a route requires them (top-down). Example: `GET /api/workspaces` needs a "list workspaces for principal" capability that does not exist on the service yet.

2. **Chat Persistence**
   - Add `chat_sessions` and `chat_messages` schema/migration.
   - Session fields: `id`, `workspace_id`, `owner_user_id`, optional `title`, `created_at`, `updated_at`, optional `archived_at`.
   - Message fields: `id`, `session_id`, `role`, ordered sequence/timestamp, and raw AI SDK `UIMessage` JSON payload.
   - Schema specifics:
     - `chat_messages.role` as a Postgres enum with values `'user' | 'assistant' | 'system'`.
     - `chat_messages.payload` as `jsonb` storing the raw AI SDK v6 `UIMessage`.
     - `ON DELETE CASCADE` from `chat_messages -> chat_sessions -> workspaces`.
     - Composite index on `(session_id, created_at)` to support ordered history loads.
   - Soft-archive only at this stage (no hard delete): expose archive that sets `archived_at`, and exclude archived sessions from default listings. Hard-delete is deferred until sharing/cleanup story exists.
   - Add repository/service methods top-down, only as routes require them: typically create session, list owner's non-archived sessions in a workspace, load one owner-owned session, load messages, persist final message history, archive session.

3. **Chat API + AI SDK v6**
   - Install dependencies: `ai` and `@ai-sdk/react`, plus the AI Elements generated components. The Vercel AI Gateway is imported from `'ai'`; no separate `@ai-sdk/gateway` package is needed.
   - Add routes under the workspace boundary, e.g. `/api/workspaces/[workspaceId]/chats` and `/api/workspaces/[workspaceId]/chats/[chatId]/messages`.
   - `POST messages` receives the latest `UIMessage`, loads stored history, validates with `validateUIMessages` (passing the tool registry; metadata and data-parts schemas left as empty slots for now), converts via `convertToModelMessages`, then calls `streamText`.
   - Use AI Gateway via `'ai'` with a fast default model behind a small model factory so the model can be swapped (including for an AI SDK `MockLanguageModelV2` from `'ai/test'` once tests are added).
   - Persist final `UIMessage[]` in `toUIMessageStreamResponse({ originalMessages, onFinish })`.
   - **AI SDK v6 specifics to encode in the route handler:**
     - On the client, use `DefaultChatTransport({ prepareSendMessagesRequest })` so only the latest message is sent on the wire; the server appends it to history loaded from storage.
     - Pass `generateMessageId: createIdGenerator({ prefix: 'msg', size: 16 })` to `toUIMessageStreamResponse` so persisted assistant messages have stable server-side IDs.
     - Call `result.consumeStream()` (no `await`) before returning so `onFinish` fires and persists even on client disconnect.
     - In `onFinish({ messages, isAborted })`, persist on abort too; if `isAborted` is true, mark the assistant message via metadata so the UI can render it as interrupted.
   - **Workspace boundary enforcement (defense-in-depth):**
     - The chat session row is the source of truth for `workspaceId`. The route handler must reject any request whose URL `[workspaceId]` segment does not equal the loaded session's stored `workspaceId`.
     - Tool `execute` functions receive `workspaceId` from a server-built context derived from the loaded session, never from URL params, request body, or model output.
   - Add one dummy tool whose execution uses the server-trusted `workspaceId` from the session context.

4. **Minimal AI Elements UI**
   - Use the AI SDK / AI Elements dependencies installed in step 3.
   - Add enough protected UI to choose/create a workspace chat, send messages, reload persisted history, and display dummy tool output.
   - Wire `useChat` with `DefaultChatTransport` and `prepareSendMessagesRequest` so the client only sends the latest message.
   - Keep UI deliberately thin; no UI tests yet.

## Final Validation (this pass)

- `pnpm lint`
- `pnpm format:check`
- Manual smoke through the protected UI: create workspace, create chat, send message, reload to confirm persistence, trigger the dummy tool.

## Deferred to a Later Pass

- **Workspace member management routes:** `GET` and `POST` on `/api/workspaces/[id]/members` are implemented. `PATCH /api/workspaces/[id]/members/[memberId]`, `DELETE /api/workspaces/[id]/members/[memberId]`, and `DELETE /api/workspaces/[id]/members/me` (leave) are deferred until invitations / member UX are designed. Repository, service, and `IWorkspacesRepository` surface for these ops are already in place. Until then, all downstream features assume single-owner workspaces.
- **Test foundation:** move Vitest/shared DB helpers from `infrastructure/test` to root `test/` (helpers, setup, scripts), add a root `vitest.config.ts` with package aliases for `@db`, `@domains`, `@infrastructure`, `@web`, `@utils`, configure `web/next.config.ts` `pageExtensions` to exclude `.test.{ts,tsx}` so colocated route tests are not treated as Next entries, and update `.cursor/rules/project-overview.mdc` section 4 to reflect colocated tests.
- **Workspace route integration tests** colocated as `route.test.ts` next to each `route.ts`, covering: auth required, non-member denial, member read access, admin/owner member management, owner-only update/delete, owner immutability, duplicate membership.
- **Chat route integration tests** covering: workspace membership required, owners only see their own chats inside a workspace, users cannot read or post to another user's private chat, posting through a mismatched workspace URL is rejected, posting streams an assistant response and persists the final messages, dummy tool result is streamed and persisted, AI calls go through `'ai/test'` mocks rather than the real provider.
- **Hard delete** on chat sessions, once sharing/cleanup semantics are designed.
- **Chat cleanup on workspace-membership removal.** Decision: when a member is removed from a workspace, do **not** touch their chats — they simply become inaccessible via the chat APIs (see `ChatsService.requireOwnedChat`). FK cascades already handle the strong signals (user deleted → chats deleted; workspace deleted → chats deleted), so the only remaining concern is long-term storage of chats whose owner is no longer a workspace member. We'll address that, if needed, with a background job (e.g. archive/hard-delete after N days of orphaned-by-membership state) once we actually have data and a real cleanup story.

## Assumptions

- Tests are deliberately deferred for this pass; when added, they will be colocated with the code they exercise and discovered from a root Vitest config.
- "Private to owner" means no workspace member except the owner can see a session until sharing exists.
- If the owner loses workspace membership, the chat becomes inaccessible through workspace chat APIs but is **not** deleted; the rows persist until the user or workspace itself is deleted, or until a future background job decides to clean them up.
- Tools operate only within the chat session's workspace, never from URL params, request body, or model-supplied workspace ids.
- AI Gateway (imported from `'ai'`) is the real provider path; future tests will swap it for an `MockLanguageModelV2` from `'ai/test'` via the model factory.
