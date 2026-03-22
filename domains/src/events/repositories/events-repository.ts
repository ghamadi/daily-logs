import { Event, EventProps } from '../entities/event';

export type CreateEventRepoInput = EventProps;

// don't allow updating the userId
export type UpdateEventRepoInput = Partial<Omit<CreateEventRepoInput, 'id' | 'userId' | 'createdAt'>> & {
  updatedAt: Date;
};

export interface FindEventsOptions {
  limit?: number;
  offset?: number;
}

export interface IEventsRepository {
  findById(id: string): Promise<Event | null>;
  findByWorkspace(workspaceId: string, options?: FindEventsOptions): Promise<Event[]>;
  create(input: CreateEventRepoInput): Promise<Event>;
  updateById(id: string, input: UpdateEventRepoInput): Promise<Event>;
  deleteById(id: string): Promise<void>;
}
