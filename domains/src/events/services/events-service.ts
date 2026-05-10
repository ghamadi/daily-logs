import { randomUUID } from 'crypto';
import { Event } from '../entities/event';
import { EventStatus } from '../value-objects/event-status';
import { IWorkspacesRepository } from '../../workspaces/repositories/workspaces-repository';
import {
  CreateEventRepoInput,
  FindEventsOptions,
  UpdateEventRepoInput,
  IEventsRepository,
} from '../repositories/events-repository';
import { DomainErrors } from '@domains/lib/errors';

export type CreateEventInput = Omit<
  CreateEventRepoInput,
  'createdAt' | 'updatedAt' | 'userId' | 'workspaceId'
>;
export type UpdateEventInput = Partial<Omit<UpdateEventRepoInput, 'createdAt' | 'updatedAt' | 'id'>>;

export class EventsService {
  constructor(
    private readonly eventsRepo: IEventsRepository,
    private readonly membersRepo: IWorkspacesRepository,
  ) {}

  async findEventById(id: string): Promise<Event | null> {
    return this.eventsRepo.findById(id);
  }

  async getEventById(props: { id: string; principalId: string }) {
    const { id, principalId } = props;
    const event = await this.findEventById(id);
    if (!event) {
      throw new DomainErrors.NotFoundError('Event not found', {
        identifier: id,
      });
    }
    await this.requireMembership(event.workspaceId, principalId);

    return event;
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

  async updateEvent(props: {
    id: string;
    principalId: string;
    input: UpdateEventInput;
  }): Promise<Event> {
    const { id, principalId, input } = props;
    const event = await this.getEventById({ id, principalId });
    return this.updateEventHelper({ event, principalId, input });
  }

  async confirmEvent(props: { id: string; principalId: string }): Promise<Event> {
    const { id, principalId } = props;
    const event = await this.getEventById({ id, principalId });
    if (event.status !== EventStatus.PROPOSED) {
      throw new DomainErrors.InvalidInputError('Only proposed events can be confirmed', {
        eventStatus: event.status,
      });
    }
    return this.updateEventHelper({ event, principalId, input: { status: EventStatus.CONFIRMED } });
  }

  async rejectEvent(props: { id: string; principalId: string }): Promise<Event> {
    const { id, principalId } = props;
    const event = await this.getEventById({ id, principalId });
    if (event.status !== EventStatus.PROPOSED) {
      throw new DomainErrors.InvalidInputError('Only proposed events can be rejected', {
        eventStatus: event.status,
      });
    }
    return this.updateEventHelper({ event, principalId, input: { status: EventStatus.REJECTED } });
  }

  // ── helpers ──────────────────────────────────────────────

  private async requireMembership(workspaceId: string, userId: string): Promise<void> {
    const isMember = await this.membersRepo.isMember({ workspaceId, memberId: userId });
    if (!isMember) {
      throw new DomainErrors.AccessDeniedError('User is not a member of this workspace');
    }
  }

  private async updateEventHelper(props: {
    event: Event;
    principalId: string;
    input: UpdateEventInput;
  }): Promise<Event> {
    const { event, principalId, input } = props;
    if (event.userId !== principalId) {
      throw new DomainErrors.AccessDeniedError('User is not the owner of this event');
    }
    return this.eventsRepo.updateById(event.id, { ...input, updatedAt: new Date() });
  }
}
