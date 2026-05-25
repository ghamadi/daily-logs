import type { UIMessage } from 'ai';
import type { ChatTools } from '@/lib/ai-sdk/tools';

/**
 * The persisted shape of a single chat message.
 *
 * We store the raw AI SDK v6 `UIMessage` JSON in `chat_messages.payload` so the
 * client can hydrate history and replay tool invocations without re-running the
 * model. The generic parameters bind the message to our concrete tool registry
 * so persisted tool-invocation parts are typed end-to-end.
 *
 * `metadata` and data-parts schemas are intentionally left as defaults until we
 * actually need them.
 */
export type UiMessagePayload = UIMessage<unknown, never, ChatTools>;
