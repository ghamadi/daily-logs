import { index, pgTable, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

import { UsersTable } from './users-table';

/**
 * Auth identities
 */
export const AuthIdentitiesTable = pgTable(
  'auth_identities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => UsersTable.id, { onDelete: 'cascade' }),
    provider: varchar('provider', { length: 64 }).notNull(),
    providerUserId: varchar('provider_user_id', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('auth_identities_provider_provider_user_id_uq').on(t.provider, t.providerUserId),
    index('auth_identities_user_id_idx').on(t.userId),
  ],
);

export type DbAuthIdentity = typeof AuthIdentitiesTable.$inferSelect;
