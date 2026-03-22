import { eq } from 'drizzle-orm';

import type { Database } from '@db/client/create-db';
import { UsersTable } from '@db/schema';
import { User } from '@domains/users/entities/user';
import type {
  CreateUserRepoInput,
  UpdateUserRepoInput,
  UsersRepository,
} from '@domains/users/repositories/users-repository';

import { requireRecord } from '../../shared/require-record';

export class DrizzleUsersRepository implements UsersRepository {
  constructor(private readonly db: Database) {}

  async findById(id: string): Promise<User | null> {
    const rows = await this.db.select().from(UsersTable).where(eq(UsersTable.id, id)).limit(1);
    const row = rows[0];

    return row ? new User(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const rows = await this.db.select().from(UsersTable).where(eq(UsersTable.email, email)).limit(1);
    const row = rows[0];

    return row ? new User(row) : null;
  }

  async create(input: CreateUserRepoInput): Promise<User> {
    const rows = await this.db.insert(UsersTable).values(input).returning();
    const row = requireRecord(rows[0], `Failed to create user "${input.id}".`);

    return new User(row);
  }

  async updateById(id: string, input: UpdateUserRepoInput): Promise<User> {
    const rows = await this.db.update(UsersTable).set(input).where(eq(UsersTable.id, id)).returning();
    const row = requireRecord(rows[0], `Failed to update user "${id}".`);

    return new User(row);
  }

  async deleteById(id: string): Promise<void> {
    await this.db.delete(UsersTable).where(eq(UsersTable.id, id));
  }
}
