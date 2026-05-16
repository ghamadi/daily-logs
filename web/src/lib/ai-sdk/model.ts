import { gateway, type LanguageModel } from 'ai';

/**
 * Default model used for chat completion. Gateway model ids follow the
 * `<provider>/<model>` convention (see Vercel AI Gateway docs). Picked for a
 * reasonable speed/quality default; swap by changing this constant or by
 * threading a `modelId` argument through the factory.
 */
const DEFAULT_CHAT_MODEL_ID = 'openai/gpt-4o-mini';

/**
 * Returns the language model used by the chat route. Centralised here so we
 * can swap provider/model in one place and so tests can replace this with an
 * `MockLanguageModelV2` from `'ai/test'` once test infrastructure lands.
 *
 * Authentication is handled by the AI Gateway provider via the
 * `AI_GATEWAY_API_KEY` environment variable; we deliberately do not pass keys
 * through the factory.
 */
export function getChatModel(): LanguageModel {
  return gateway(DEFAULT_CHAT_MODEL_ID);
}
