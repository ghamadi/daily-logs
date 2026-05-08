import { and, eq } from 'drizzle-orm';
import type { Database } from '@db/client/create-db';
import { AuthIdentitiesTable, UsersTable } from '@db/schema';
import { User } from '@domains/users/entities/user';
import type {
  CreateUserRepoInput,
  UpdateUserRepoInput,
  IUsersRepository,
  FindByEmailOptions,
} from '@domains/users/repositories/users-repository';
import { assertNotNullish } from '@utils/assertions';

export class DrizzleUsersRepository implements IUsersRepository {
  constructor(private readonly db: Database) {}

  async findById(id: string): Promise<User | null> {
    const [row = null] = await this.db.select().from(UsersTable).where(eq(UsersTable.id, id)).limit(1);

    return row && new User(row);
  }

  async findByEmail(email: string, options?: FindByEmailOptions): Promise<User | null> {
    const { provider, providerUserId } = options ?? {};

    const baseQuery = this.db.select({ user: UsersTable }).from(UsersTable);

    const query = provider
      ? baseQuery.innerJoin(
          AuthIdentitiesTable,
          and(
            eq(AuthIdentitiesTable.userId, UsersTable.id),
            eq(AuthIdentitiesTable.provider, provider),
            eq(AuthIdentitiesTable.providerUserId, providerUserId),
          ),
        )
      : baseQuery;

    const [row = null] = await query.where(eq(UsersTable.email, email)).limit(1);

    return row && new User(row.user);
  }

  async create(input: CreateUserRepoInput) {
    return this.db.transaction(async (tx) => {
      const { provider, providerUserId, ...userInput } = input;
      const [userRow] = await tx.insert(UsersTable).values(userInput).returning();

      assertNotNullish(userRow, `Failed to create user "${userInput.email}".`);

      await tx.insert(AuthIdentitiesTable).values({
        userId: userRow.id,
        provider,
        providerUserId,
      });

      return new User(userRow);
    });
  }

  async updateById(id: string, input: UpdateUserRepoInput) {
    const [row] = await this.db
      .update(UsersTable)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(UsersTable.id, id))
      .returning();

    assertNotNullish(row, `Failed to update user "${id}".`);

    return new User(row);
  }

  async deleteById(id: string) {
    await this.db.delete(UsersTable).where(eq(UsersTable.id, id));
  }
}
