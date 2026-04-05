import { type DbEventStatus } from '@db/schema';
import { Enum } from '@utils/ts-utils';

export const EventStatus = {
  PROPOSED: 'proposed',
  CONFIRMED: 'confirmed',
  REJECTED: 'rejected',
} as const satisfies Record<string, DbEventStatus>;

export type EventStatus = Enum<typeof EventStatus>;
