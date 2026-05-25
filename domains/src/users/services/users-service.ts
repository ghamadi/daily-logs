import { DomainErrors } from '@domains/lib/errors';
import { User } from '../entities/user';
import {
  UpsertUserRepoInput,
  UpdateUserRepoInput,
  IUsersRepository,
} from '../repositories/users-repository';

export type CreateUserInput = UpsertUserRepoInput;
export type UpdateUserInput = UpdateUserRepoInput;

export class UsersService {
  constructor(private readonly usersRepo: IUsersRepository) {}

  findUserById(id: string): Promise<User | null> {
    return this.usersRepo.findById(id);
  }

  findUserByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findByEmail(email);
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.findUserById(id);
    if (!user) {
      throw new DomainErrors.NotFoundError('User not found', { id });
    }
    return user;
  }

  async getUserByEmail(email: string): Promise<User> {
    const user = await this.findUserByEmail(email);
    if (!user) {
      throw new DomainErrors.NotFoundError('User not found', { email });
    }
    return user;
  }

  async createUser(input: UpsertUserRepoInput): Promise<User> {
    const existingEmail = await this.findUserByEmail(input.email);

    if (existingEmail) {
      throw new DomainErrors.InvalidInputError('Email is already in use', { email: input.email });
    }

    return this.usersRepo.getOrCreateUser(input);
  }

  async updateUser(id: string, input: UpdateUserInput): Promise<User> {
    await this.getUserById(id);
    return this.usersRepo.updateById(id, { ...input });
  }

  async deactivateUser(id: string): Promise<User> {
    return this.updateUser(id, { isActive: false });
  }
}
