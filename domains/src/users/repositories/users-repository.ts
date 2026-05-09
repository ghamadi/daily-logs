import type { DbUser } from '@db/schema';
import type { AuthProvider } from '../value-objects/auth-provider';
import { User } from '../entities/user';

type UserInput = Omit<DbUser, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateUserRepoInput = Partial<UserInput>;

export type UpsertUserRepoInput = Partial<UserInput> & {
  email: string;
  provider: AuthProvider;
  providerUserId: string;
};

export type FindByEmailOptions =
  | { provider: AuthProvider; providerUserId: string }
  | { provider?: undefined; providerUserId?: undefined };

export interface IUsersRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string, options?: FindByEmailOptions): Promise<User | null>;
  getOrCreateUser(input: UpsertUserRepoInput): Promise<User>;
  updateById(id: string, input: UpdateUserRepoInput): Promise<User>;
  deleteById(id: string): Promise<void>;
}
