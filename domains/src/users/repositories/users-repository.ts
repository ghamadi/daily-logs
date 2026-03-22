import type { DbAuthIdentity, DbUser } from '@db/schema';
import type { AuthProvider } from '../value-objects/auth-provider';
import { User } from '../entities/user';

export type CreateUserRepoInput = Omit<DbUser, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateUserRepoInput = Partial<CreateUserRepoInput>;

export type AuthIdentityLookup = {
  provider: AuthProvider;
  providerUserId: string;
};

export type LinkAuthIdentityRepoInput = AuthIdentityLookup & { userId: DbAuthIdentity['userId'] };

export type CreateUserWithAuthIdentityRepoInput = CreateUserRepoInput & AuthIdentityLookup;

export interface UsersRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByAuthIdentity(input: AuthIdentityLookup): Promise<User | null>;
  create(input: CreateUserRepoInput): Promise<User>;
  createWithAuthIdentity(input: CreateUserWithAuthIdentityRepoInput): Promise<User>;
  linkAuthIdentity(input: LinkAuthIdentityRepoInput): Promise<void>;
  updateById(id: string, input: UpdateUserRepoInput): Promise<User>;
  deleteById(id: string): Promise<void>;
}
