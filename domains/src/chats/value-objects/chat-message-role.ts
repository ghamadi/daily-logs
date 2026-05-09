import { type DbChatMessageRole } from '@db/schema';
import { Enum } from '@utils/ts-utils';

export const ChatMessageRole = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
} as const satisfies Record<string, DbChatMessageRole>;

export type ChatMessageRole = Enum<typeof ChatMessageRole>;
