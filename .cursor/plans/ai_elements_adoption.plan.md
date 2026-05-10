---
name: AI Elements adoption plan
overview: Replace the custom chat UI in chat-thread.tsx with AI Elements components in 4 incremental steps (Conversation → Message → Tool → PromptInput). Server-side wire contract stays unchanged; PromptInput's model picker and attachment slots render but are deliberately inert until backend support lands.
todos:
  - id: step1
    content: 'Step 1 — Conversation: install use-stick-to-bottom, add conversation.tsx, swap scroll container in chat-thread.tsx, verify smart scroll'
    status: pending
  - id: step2
    content: 'Step 2 — Message + MessageContent: install streamdown family, add tooltip + button-group shadcn, add message.tsx, route text parts through MessageResponse'
    status: pending
  - id: step3
    content: 'Step 3 — Tool + CodeBlock: install shiki, add badge + collapsible + select shadcn, add code-block.tsx + tool.tsx, replace custom ToolInvocation'
    status: pending
  - id: step4
    content: 'Step 4 — PromptInput: install nanoid, add command + dropdown-menu + hover-card + input-group + spinner shadcn, add prompt-input.tsx + attachments.tsx, replace Composer with inert model picker + attach slot'
    status: pending
  - id: step5
    content: 'Step 5 — Cleanup: delete dead helpers, run final lint/format/tsc, update .cursor/plans/workspaces.plan.md'
    status: pending
isProject: false
---

# AI Elements Adoption Plan

## Goal

Replace the hand-rolled chat UI in [web/src/lib/chat/components/chat-thread.tsx](web/src/lib/chat/components/chat-thread.tsx) with [AI Elements](https://elements.ai-sdk.dev/) components, in 4 small increments. Each increment leaves the chat working end-to-end (`pnpm lint`, `pnpm format:check`, manual smoke through `/workspaces/[id]/chats/[id]`).

## Constraints (decided; do not relitigate)

- **Server wire contract is unchanged.** `POST /api/workspaces/[workspaceId]/chats/[chatId]/messages` still expects `{ message: UIMessage }` and rebuilds history from the DB. No changes to [web/src/app/api/workspaces/[workspaceId]/chats/[chatId]/messages/route.ts](web/src/app/api/workspaces/[workspaceId]/chats/[chatId]/messages/route.ts), [web/src/lib/chat/transport.ts](web/src/lib/chat/transport.ts), or [web/src/lib/chat/system-prompt.ts](web/src/lib/chat/system-prompt.ts) in this plan.
- **Model picker and attachment buttons render but are inert.** They show in the composer so the UI shape is right, but a single hard-coded model id is sent and the attach button is `disabled` (or omitted) with a tooltip explaining it's coming soon. Wiring multi-model + uploads is a follow-up plan.
- **Manual install workflow per file.** Project has no `components.json` and our existing UI primitives ([web/src/components/ui/button.tsx](web/src/components/ui/button.tsx), [dialog.tsx](web/src/components/ui/dialog.tsx), [label.tsx](web/src/components/ui/label.tsx)) use:
  - The `radix-ui` umbrella package (e.g. `import { Dialog as DialogPrimitive } from 'radix-ui'`) instead of `@radix-ui/react-` per-primitive packages
  - `cn` from `@web/lib/utils/components` instead of `@/lib/utils`
  - Files under `web/src/components/ui/`
    Each new shadcn primitive is copied from `https://ui.shadcn.com/r/styles/default/<name>.json`, dropped into `web/src/components/ui/<name>.tsx`, and adapted to those conventions.
- **AI Elements live in their own folder.** Add at `web/src/components/ai-elements/<name>.tsx` (mirrors the shadcn convention `components/ai-elements/`). Fetch each file from `https://elements.ai-sdk.dev/api/registry/<name>.json` (the `files[0].content` field), then rewrite imports:
  - `@/registry/default/ui/<x>` → `@web/components/ui/<x>`
  - `@/lib/utils` → `@web/lib/utils/components`
  - Internal `./<other-element>` imports stay relative (they resolve within `web/src/components/ai-elements/`).
- **Each step ends in a clean working tree.** Run `pnpm lint`, `pnpm format:check`, `pnpm -C web exec tsc --noEmit`, and a manual smoke. No step depends on a later step compiling.

## Files modified across the plan

Primary target throughout: [web/src/lib/chat/components/chat-thread.tsx](web/src/lib/chat/components/chat-thread.tsx). Today its structure is:

```
ChatThread
├── MessageList               (custom — replaced in steps 1-3)
│   └── MessageBubble
│       └── MessagePart       (text / reasoning / tool / step-start)
│           └── ToolInvocation
└── Composer                  (custom — replaced in step 4)
```

After the plan it becomes a thin orchestrator over AI Elements, keeping the same `useChat` wiring.

---

## Step 1 — Conversation (smart scroll)

Smallest, lowest risk. Replaces the naive `scrollTop = scrollHeight` with a proper "stick to bottom unless the user scrolled up" container.

**shadcn primitives to install (manually):** none new (`Conversation` only depends on `button`, which we have).

**npm deps to install:** `use-stick-to-bottom` (in `web/package.json`).

**AI Element files to add:**

- `web/src/components/ai-elements/conversation.tsx` — copied from `https://elements.ai-sdk.dev/api/registry/conversation.json`, imports adapted.

**chat-thread.tsx changes:**

- Drop the `useRef`/`useEffect` scroll logic and the `scrollRef` prop threading.
- Wrap the message list in `<Conversation>` → `<ConversationContent>` → messages, plus `<ConversationScrollButton>` for the floating "back to bottom" affordance.
- Keep the existing `MessageBubble` switch for now — it still renders inside the new container.

**Done when:** chat scrolls smoothly during streaming; scrolling up while streaming does not yank back; the scroll-to-bottom button appears when not at bottom.

---

## Step 2 — Message + MessageContent (markdown)

Replaces our custom bubble + `whitespace-pre-wrap` with proper markdown rendering via Streamdown. Single biggest visible UX win.

**shadcn primitives to install (manually):**

- `tooltip` — used by `MessageAction`. Even if we don't render actions today, `message.tsx` imports it at the top so the file must exist.
- `button-group` — used by `MessageBranchSelector`, same reason.

**npm deps to install:** `streamdown`, `@streamdown/cjk`, `@streamdown/code`, `@streamdown/math`, `@streamdown/mermaid`.

**AI Element files to add:**

- `web/src/components/ai-elements/message.tsx` — from `https://elements.ai-sdk.dev/api/registry/message.json`, imports adapted.

**chat-thread.tsx changes:**

- Replace `MessageBubble` with `<Message from={message.role}>` + `<MessageContent>` per turn.
- Inside `MessageContent`, walk `message.parts`:
  - `text` parts feed `MessageResponse` (the Streamdown wrapper exported from `message.tsx`) so we get markdown formatting.
  - Tool / reasoning / step-start parts continue to use the existing custom rendering until step 3.
- Drop our custom role label header — `Message`'s role-aware styling covers it.

**Done when:** a reply that includes lists/bold/code-spans/links renders properly; user vs assistant alignment matches before; tool invocations still render via the old switch.

---

## Step 3 — Tool + CodeBlock (tool rendering)

Replaces our hand-rolled `ToolInvocation` with the structured `Tool` component family — collapsible, with a status badge and syntax-highlighted JSON for input/output. Reasoning is also picked up here since it shares `collapsible`.

**shadcn primitives to install (manually):**

- `badge` — for the tool status pill.
- `collapsible` — for `Tool` and `Reasoning`.
- `select` — used by `code-block`'s language picker (we won't render it, but the file imports it).

**npm deps to install:** `shiki` (syntax highlighter; chunky but tree-shakes well).

**Optional npm dep:** `@radix-ui/react-use-controllable-state` only if you want to add `Reasoning` (used by the Reasoning component). Skip if we don't render reasoning today (gpt-4o-mini doesn't surface it).

**AI Element files to add:**

- `web/src/components/ai-elements/code-block.tsx` (from `https://elements.ai-sdk.dev/api/registry/code-block.json`).
- `web/src/components/ai-elements/tool.tsx` (from `https://elements.ai-sdk.dev/api/registry/tool.json`). It imports `./code-block` so the relative path stays as-is.
- Optional: `web/src/components/ai-elements/reasoning.tsx` and `shimmer.tsx` (the latter is a small dep used by reasoning).

**chat-thread.tsx changes:**

- Replace `ToolInvocation` switch in the parts loop with:

```
  <Tool>
    <ToolHeader type={part.type} state={part.state} />
    <ToolContent>
      <ToolInput input={part.input} />
      <ToolOutput output={part.output} errorText={part.errorText} />
    </ToolContent>
  </Tool>


```

Use `isToolUIPart` from `'ai'` (already imported) to narrow before rendering.

- Drop `PreBlock` / `safeStringify` helpers — replaced by `ToolInput`/`ToolOutput`.
- Render the `Tool` block as a sibling of `MessageContent` inside `<Message>`, not inside `MessageContent` (which is for prose). This keeps the bubble layout sane.

**Done when:** asking _"what workspace am I in?"_ shows a collapsible tool block with status (`Pending` → `Running` → `Completed`) and pretty-printed JSON for input + output; expanding/collapsing works.

---

## Step 4 — PromptInput (composer + inert model picker + inert attachment slot)

Replaces our textarea + send button with `PromptInput`. Renders the model-picker dropdown and attachment button in the toolbar so the UI shape is final, but neither is functionally wired (single hard-coded model; attach button disabled with tooltip).

**shadcn primitives to install (manually):**

- `command` — used by PromptInput (and required by `model-selector` if we use it).
- `dropdown-menu` — used by PromptInput.
- `hover-card` — used by PromptInput (and by `attachments`).
- `input-group` — used by PromptInput (the composer wrapper).
- `spinner` — used by PromptInput's pending state.
- (`select` and `tooltip` already installed in steps 2-3.)

**npm deps to install:** `nanoid` (used by PromptInput for ephemeral ids).

**AI Element files to add:**

- `web/src/components/ai-elements/prompt-input.tsx` (from `https://elements.ai-sdk.dev/api/registry/prompt-input.json`).
- `web/src/components/ai-elements/attachments.tsx` (from `https://elements.ai-sdk.dev/api/registry/attachments.json`) — for the attachment chip strip inside the composer.
- Optional: `web/src/components/ai-elements/model-selector.tsx` (Cmd+K-style picker dialog). PromptInput's built-in select is enough for one option; add this only if we want the fancier picker later.

**chat-thread.tsx changes:**

- Drop our `Composer` component entirely.
- Replace with `<PromptInput>` containing:
  - `<PromptInputBody>` (or equivalent text area slot) bound to `input`/`setInput`.
  - `<PromptInputToolbar>` with:
    - A model-picker slot rendering one option (`openai/gpt-4o-mini`). Selected value lives in local state but is not yet sent on the wire.
    - An attach button that is either omitted or rendered with `disabled` + a `Tooltip` ("Attachments coming soon"). Pick one based on what looks right; omitting is cheaper.
    - A submit button that calls `sendMessage({ text })` (unchanged from today).
  - Pending / streaming state driven by `useChat().status`, with stop button swap as today.
- Keep the error banner outside `<PromptInput>` (above it), unchanged.

**Done when:** composer renders the toolbar; Enter still sends; stop still works; model picker visible (one option); attach button visible-but-disabled or absent; round-trip to chat still works end-to-end.

---

## Step 5 — Cleanup + plan-doc update

Small wrap-up. No new deps.

- Delete dead code from [chat-thread.tsx](web/src/lib/chat/components/chat-thread.tsx): the in-file `MessageBubble`, `MessagePart`, `ToolInvocation`, `Composer`, `PreBlock`, `safeStringify` should all be gone by end of step 4 — verify and remove any leftovers.
- Run final `pnpm lint`, `pnpm format:check`, `pnpm -C web exec tsc --noEmit`.
- Update [.cursor/plans/workspaces.plan.md](.cursor/plans/workspaces.plan.md) Step 4 section to note that AI Elements is now in use, and move "Richer chat UI: Markdown rendering, code blocks, copy-to-clipboard, message editing, regenerate, smarter stick-to-bottom scroll" out of Deferred (markdown / code / smart scroll are now shipped; the rest stays).
- Add a new Deferred entry for the inert pieces:
  - **Functional model picker:** allow-list on the server, `modelId` threaded through `prepareSendMessagesRequest` body, validated and routed in `getChatModel(modelId)`.
  - **Functional attachments:** storage backend selection (Supabase / Vercel Blob / etc.), upload flow, server-side `FileUIPart` validation.

---

## Out of scope for this plan

- Server-side support for multi-model selection or attachment uploads (call out separately later).
- Adding `Sources`, `Suggestion`, `Actions`, or any other AI Elements not listed above. They can come in follow-up passes when there's a UX need.
- Theming polish — we accept whatever visual defaults Streamdown / Tool / PromptInput ship with. The site already uses our shadcn token system, so they should inherit reasonably.

## Final validation

After step 5:

1. `pnpm lint` — clean.
2. `pnpm format:check` — clean.
3. `pnpm -C web exec tsc --noEmit` — clean.
4. Manual smoke:

- Create workspace → create chat → send a message → see assistant stream with markdown.
- Ask _"what workspace am I in?"_ → see Tool block with status + collapsed JSON.
- Scroll up during streaming → no yank-back; scroll-to-bottom button appears.
- Reload chat page → history rehydrates identically.
