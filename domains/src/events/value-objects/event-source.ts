import { Enum } from '@utils/ts-utils';

export const EventSource = {
  User: 1,
  Assistant: 2,
} as const;
export type EventSource = Enum<typeof EventSource>;
