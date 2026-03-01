import { EventStatus, EventType } from '@db-exports/enums';

export { EventType, EventStatus };

/**
 * Returns true if the status can still be acted upon (confirmed or rejected).
 */
export function isActionable(status: EventStatus): boolean {
  return status === EventStatus.Proposed;
}
