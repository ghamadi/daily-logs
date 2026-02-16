import { EventStatus, EventType } from '@db/schema/enums';

// TODO: Make this a discriminated union of possible data types
export type EventData = Record<string, unknown>;

export interface EventProps {
  id: string;
  workspaceId: string;
  userId: string;
  messageId: number | null;
  type: EventType;
  status: EventStatus;
  happenedAt: Date;
  summary: string;
  confidence: number | null;
  createdAt: Date;
  updatedAt: Date;
  data: EventData;
}

export class Event {
  readonly id: string;
  readonly workspaceId: string;
  readonly userId: string;
  readonly messageId: number | null;
  readonly type: EventType;
  readonly status: EventStatus;
  readonly happenedAt: Date;
  readonly summary: string;
  readonly confidence: number | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly data: EventData;

  constructor(props: EventProps) {
    this.id = props.id;
    this.workspaceId = props.workspaceId;
    this.userId = props.userId;
    this.messageId = props.messageId;
    this.type = props.type;
    this.status = props.status;
    this.happenedAt = props.happenedAt;
    this.summary = props.summary;
    this.confidence = props.confidence;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.data = props.data;
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
