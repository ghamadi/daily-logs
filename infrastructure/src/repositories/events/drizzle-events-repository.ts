import { desc, eq } from 'drizzle-orm';
import type { Database } from '@db/client/create-db';
import { EventsTable } from '@db/schema';
import { Event } from '@domains/events/entities/event';
import type {
  CreateEventRepoInput,
  FindEventsOptions,
  IEventsRepository,
  UpdateEventRepoInput,
} from '@domains/events/repositories/events-repository';

import { requireRecord } from '../../shared/require-record';

export class DrizzleEventsRepository implements IEventsRepository {
  constructor(private readonly db: Database) {}

  async findById(id: string): Promise<Event | null> {
    const rows = await this.db.select().from(EventsTable).where(eq(EventsTable.id, id)).limit(1);
    const row = rows[0];

    return row ? new Event(row) : null;
  }

  async findByWorkspace(workspaceId: string, options?: FindEventsOptions) {
    const { limit, offset } = options ?? {};

    const baseQuery = this.db
      .select()
      .from(EventsTable)
      .where(eq(EventsTable.workspaceId, workspaceId))
      .orderBy(desc(EventsTable.happenedAt), desc(EventsTable.createdAt));

    const rows = await (async () => {
      if (limit !== undefined && offset !== undefined) {
        return await baseQuery.limit(limit).offset(offset);
      }
      if (limit !== undefined) {
        return await baseQuery.limit(limit);
      }
      if (offset !== undefined) {
        return await baseQuery.offset(offset);
      }
      return await baseQuery;
    })();

    return rows.map((row) => new Event(row));
  }

  async create(input: CreateEventRepoInput) {
    const rows = await this.db.insert(EventsTable).values(input).returning();
    const row = requireRecord(rows[0], `Failed to create event "${input.id}".`);

    return new Event(row);
  }

  async updateById(id: string, input: UpdateEventRepoInput) {
    const rows = await this.db.update(EventsTable).set(input).where(eq(EventsTable.id, id)).returning();
    const row = requireRecord(rows[0], `Failed to update event "${id}".`);

    return new Event(row);
  }

  async deleteById(id: string): Promise<void> {
    await this.db.delete(EventsTable).where(eq(EventsTable.id, id));
  }
}
