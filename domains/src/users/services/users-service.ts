import { EntityNotFoundError } from '../../shared/errors/entity-not-found-error';
import { InvalidInputError } from '../../shared/errors/invalid-input-error';
import { User } from '../entities/user';
import { CreateUserRepoInput, UpdateUserRepoInput, UsersRepository } from '../repositories/users-repository';

export type CreateUserInput = CreateUserRepoInput;
export type UpdateUserInput = UpdateUserRepoInput;

export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  findUserById(id: string): Promise<User | null> {
    return this.usersRepo.findById(id);
  }

  findUserByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findByEmail(email);
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.findUserById(id);
    if (!user) {
      throw EntityNotFoundError.create({ entity: 'User', identifier: id });
    }
    return user;
  }

  async getUserByEmail(email: string): Promise<User> {
    const user = await this.findUserByEmail(email);
    if (!user) {
      throw EntityNotFoundError.create({ entity: 'User', identifier: email });
    }
    return user;
  }

  async createUser(input: CreateUserInput): Promise<User> {
    const existingEmail = await this.findUserByEmail(input.email);

    if (existingEmail) {
      throw InvalidInputError.create({ field: 'email', reason: 'Email is already in use' });
    }

    return this.usersRepo.create(input);
  }

  async updateUser(id: string, input: UpdateUserInput): Promise<User> {
    await this.getUserById(id);
    return this.usersRepo.updateById(id, { ...input });
  }

  async deactivateUser(id: string): Promise<User> {
    return this.updateUser(id, { isActive: false });
  }
}
