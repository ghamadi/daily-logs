import { type DbEventStatus } from '@daily-logs/db/schema';
import { Enum } from '@daily-logs/utils/ts-utils';

export const EventStatus = {
  PROPOSED: 'proposed',
  CONFIRMED: 'confirmed',
  REJECTED: 'rejected',
} as const satisfies Record<string, DbEventStatus>;

export type EventStatus = Enum<typeof EventStatus>;
