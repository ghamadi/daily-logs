import { EventStatus } from '@db/schema/enums';

import { AccessDeniedError } from '../../shared/errors/access-denied-error';
import { EntityNotFoundError } from '../../shared/errors/entity-not-found-error';
import { InvalidInputError } from '../../shared/errors/invalid-input-error';
import { WorkspaceMembersRepository } from '../../workspaces/repositories/workspace-members-repository';
import { Event } from '../entities/event';
import { EventData } from '../entities/event-data-record';
import {
  CreateEventRepoInput,
  EventsRepository,
  FindEventsOptions,
  UpdateEventRepoInput,
} from '../repositories/events-repository';
import { isActionable } from '../value-objects/event-type';
import { randomUUID } from 'crypto';

export type CreateEventInput = Omit<CreateEventRepoInput, 'createdAt' | 'updatedAt' | 'userId' | 'workspaceId'>;
export type UpdateEventInput = Partial<Omit<UpdateEventRepoInput, 'createdAt' | 'updatedAt' | 'id'>>;

type EventWithData = Omit<Event, 'data'> & { data: EventData };

export class EventsService {
  constructor(
    private readonly eventsRepo: EventsRepository,
    private readonly membersRepo: WorkspaceMembersRepository,
  ) {}

  async findEventById(id: string, options?: { includeData?: boolean }): Promise<Event | null> {
    return this.eventsRepo.findById(id, options);
  }

  async getEventById(props: { id: string; principalId: string } & { includeData?: false }): Promise<Event>;
  async getEventById(props: { id: string; principalId: string } & { includeData: true }): Promise<EventWithData>;
  async getEventById(props: { id: string; principalId: string } & { includeData?: boolean }) {
    const { id, principalId, includeData } = props;
    const event = await this.findEventById(id, { includeData });
    if (!event) {
      throw EntityNotFoundError.create({ entity: 'Event', identifier: id });
    }
    await this.requireMembership(event.workspaceId, principalId);

    return { ...event, data: event.data ?? {} } as Event | EventWithData;
  }

  async getEventsByWorkspace(props: { workspaceId: string; principalId: string } & FindEventsOptions) {
    const { workspaceId, principalId, ...options } = props;
    await this.requireMembership(workspaceId, principalId);
    return this.eventsRepo.findByWorkspace(workspaceId, options);
  }

  async createEvent(props: { workspaceId: string; principalId: string; input: CreateEventInput }) {
    const { workspaceId, principalId, input } = props;
    const { id = randomUUID(), ...rest } = input;
    const now = new Date();
    await this.requireMembership(workspaceId, principalId);
    return this.eventsRepo.create({
      id,
      workspaceId,
      userId: principalId,
      createdAt: now,
      updatedAt: now,
      ...rest,
    });
  }

  async updateEvent(props: { id: string; principalId: string; input: UpdateEventInput }): Promise<Event> {
    const { id, principalId, input } = props;
    const event = await this.getEventById({ id, principalId });
    return this.updateEventHelper({ event, principalId, input });
  }

  async confirmEvent(props: { id: string; principalId: string }): Promise<Event> {
    const { id, principalId } = props;
    const event = await this.getEventById({ id, principalId });
    if (!isActionable(event.status)) {
      throw InvalidInputError.create({ field: 'status', reason: 'Only proposed events can be confirmed' });
    }
    return this.updateEventHelper({ event, principalId, input: { status: EventStatus.Confirmed } });
  }

  async rejectEvent(props: { id: string; principalId: string }): Promise<Event> {
    const { id, principalId } = props;
    const event = await this.getEventById({ id, principalId });
    if (!isActionable(event.status)) {
      throw InvalidInputError.create({ field: 'status', reason: 'Only proposed events can be rejected' });
    }
    return this.updateEventHelper({ event, principalId, input: { status: EventStatus.Rejected } });
  }

  async getEventData(props: { id: string; principalId: string }) {
    const { id, principalId } = props;
    const event = await this.getEventById({ id, principalId, includeData: true });
    return event.data;
  }

  // ── helpers ──────────────────────────────────────────────

  private async requireMembership(workspaceId: string, userId: string): Promise<void> {
    const member = await this.membersRepo.getMember({ workspaceId, userId });
    if (!member) {
      throw new AccessDeniedError('User is not a member of this workspace');
    }
  }

  private async updateEventHelper(props: {
    event: Event;
    principalId: string;
    input: UpdateEventInput;
  }): Promise<Event> {
    const { event, principalId, input } = props;
    if (event.userId !== principalId) {
      throw new AccessDeniedError('User is not the owner of this event');
    }
    return this.eventsRepo.updateById(event.id, { ...input, updatedAt: new Date() });
  }
}
