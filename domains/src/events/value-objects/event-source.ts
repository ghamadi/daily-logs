import { type DbEventSource } from '@daily-logs/db/schema';
import { Enum } from '@daily-logs/utils/ts-utils';

export const EventSource = {
  USER: 'user',
  ASSISTANT: 'assistant',
} as const satisfies Record<string, DbEventSource>;

export type EventSource = Enum<typeof EventSource>;
