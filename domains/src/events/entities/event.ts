import type { DbEvent } from '@db/schema';
import { EventStatus } from '@domains/events/value-objects/event-status';
import { EventType } from '@domains/events/value-objects/event-type';
import { EventSource } from '@domains/events/value-objects/event-source';

export type EventProps = DbEvent;

export class Event {
  readonly id: string;
  readonly workspaceId: string;
  readonly userId: string;
  readonly type: EventType;
  readonly status: EventStatus;
  readonly source: EventSource;
  readonly happenedAt: Date;
  readonly summary: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: EventProps) {
    this.id = props.id;
    this.workspaceId = props.workspaceId;
    this.userId = props.userId;
    this.type = props.type;
    this.status = props.status;
    this.happenedAt = props.happenedAt;
    this.summary = props.summary;
    this.source = props.source;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  get isProposed(): boolean {
    return this.status === EventStatus.Proposed;
  }

  get isConfirmed(): boolean {
    return this.status === EventStatus.Confirmed;
  }

  get isRejected(): boolean {
    return this.status === EventStatus.Rejected;
  }
}
