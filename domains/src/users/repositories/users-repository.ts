import { User, type UserProps } from '../entities/user';

export type CreateUserRepoInput = UserProps;
export type UpdateUserRepoInput = Omit<Partial<CreateUserRepoInput>, 'id' | 'createdAt'> & { updatedAt: Date };

export interface UsersRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(input: CreateUserRepoInput): Promise<User>;
  updateById(id: string, input: UpdateUserRepoInput): Promise<User>;
  deleteById(id: string): Promise<void>;
}
