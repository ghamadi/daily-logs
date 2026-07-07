import { and, eq } from 'drizzle-orm';
import type { Database } from '@daily-logs/db/client';
import { AuthIdentitiesTable, UsersTable } from '@daily-logs/db/schema';
import {
  User,
  type UpsertUserRepoInput,
  type UpdateUserRepoInput,
  type IUsersRepository,
  type FindByEmailOptions,
} from '@daily-logs/domains/users';
import { assertNotNullish } from '@daily-logs/utils/assertions';

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

  async getOrCreateUser(input: UpsertUserRepoInput) {
    return this.db.transaction(async (tx) => {
      const { provider, providerUserId, ...userInput } = input;
      const [userRow] = await tx
        .insert(UsersTable)
        .values(userInput)
        .onConflictDoUpdate({
          target: [UsersTable.email],
          set: {
            // no-op update since the email is the same
            // we only update for `returning()` to return the user record
            email: userInput.email,
          },
        })
        .returning();

      assertNotNullish(userRow, `Failed to upsert user "${userInput.email}".`);

      await tx
        .insert(AuthIdentitiesTable)
        .values({
          userId: userRow.id,
          provider,
          providerUserId,
        })
        .onConflictDoNothing({
          target: [AuthIdentitiesTable.provider, AuthIdentitiesTable.providerUserId],
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
