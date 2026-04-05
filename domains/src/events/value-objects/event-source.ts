import { type DbEventSource } from '@db/schema';
import { Enum } from '@utils/ts-utils';

export const EventSource = {
  USER: 'user',
  ASSISTANT: 'assistant',
} as const satisfies Record<string, DbEventSource>;

export type EventSource = Enum<typeof EventSource>;
