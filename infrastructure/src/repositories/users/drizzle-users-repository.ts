import { and, eq } from 'drizzle-orm';

import type { Database, Transaction } from '@db/client/create-db';
import { AuthIdentitiesTable, UsersTable } from '@db/schema';
import { User } from '@domains/users/entities/user';
import type {
  AuthIdentityLookup,
  CreateUserWithAuthIdentityRepoInput,
  CreateUserRepoInput,
  LinkAuthIdentityRepoInput,
  UpdateUserRepoInput,
  UsersRepository,
} from '@domains/users/repositories/users-repository';
import { requireRecord } from '../../shared/require-record';
import { assertNotNullish } from '@utils/ts-utils';

type QueryExecutor = Database | Transaction;

export class DrizzleUsersRepository implements UsersRepository {
  constructor(private readonly db: Database) {}

  async findById(id: string): Promise<User | null> {
    const [row = null] = await this.db.select().from(UsersTable).where(eq(UsersTable.id, id)).limit(1);

    return row && new User(row);
  }

  async findByEmail(email: string): Promise<User | null> {
    const [row = null] = await this.db.select().from(UsersTable).where(eq(UsersTable.email, email)).limit(1);

    return row && new User(row);
  }

  async findByAuthIdentity(input: AuthIdentityLookup): Promise<User | null> {
    const [row = null] = await this.db
      .select({ user: UsersTable })
      .from(UsersTable)
      .innerJoin(AuthIdentitiesTable, eq(AuthIdentitiesTable.userId, UsersTable.id))
      .where(
        and(
          eq(AuthIdentitiesTable.provider, input.provider),
          eq(AuthIdentitiesTable.providerUserId, input.providerUserId),
        ),
      )
      .limit(1);

    return row && new User(row.user);
  }

  async create(input: CreateUserRepoInput) {
    const [row] = await this.db.insert(UsersTable).values(input).returning();
    assertNotNullish(row, `Failed to create user "${input.email}".`);

    return new User(row);
  }

  async createWithAuthIdentity(input: CreateUserWithAuthIdentityRepoInput) {
    return this.db.transaction(async (tx) => {
      const { provider, providerUserId, ...userInput } = input;
      const [userRow] = await tx.insert(UsersTable).values(userInput).returning();
      assertNotNullish(userRow, `Failed to create user "${userInput.email}".`);

      await this.insertAuthIdentity(tx, {
        provider,
        providerUserId,
        userId: userRow.id,
      });

      return new User(userRow);
    });
  }

  async linkAuthIdentity(input: LinkAuthIdentityRepoInput & { userId: string }) {
    await this.insertAuthIdentity(this.db, input);
  }

  async updateById(id: string, input: UpdateUserRepoInput) {
    const rows = await this.db
      .update(UsersTable)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(UsersTable.id, id))
      .returning();
    const row = requireRecord(rows[0], `Failed to update user "${id}".`);

    return new User(row);
  }

  async deleteById(id: string) {
    await this.db.delete(UsersTable).where(eq(UsersTable.id, id));
  }

  private async insertAuthIdentity(db: QueryExecutor, input: LinkAuthIdentityRepoInput) {
    const { userId, provider, providerUserId } = input;

    await db.insert(AuthIdentitiesTable).values({
      userId,
      provider,
      providerUserId,
    });
  }
}
