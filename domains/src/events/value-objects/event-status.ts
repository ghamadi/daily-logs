import { Enum } from '@utils/ts-utils';

export const EventStatus = {
  Unknown: 0,
  Proposed: 1,
  Confirmed: 2,
  Rejected: 3,
} as const;
export type EventStatus = Enum<typeof EventStatus>;

/**
 * Returns true if the status can still be acted upon (confirmed or rejected).
 */
export function isActionable(status: EventStatus): boolean {
  return status === EventStatus.Proposed;
}
