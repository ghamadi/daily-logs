import { Enum } from '@domains/shared/ts-utils';

export const EventType = {
  Unknown: 0,
  Note: 1,
} as const;
export type EventType = Enum<typeof EventType>;
