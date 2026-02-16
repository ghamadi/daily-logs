import { randomUUID } from 'crypto';
import { EntityNotFoundError } from '../../shared/errors/entity-not-found-error';
import { InvalidInputError } from '../../shared/errors/invalid-input-error';
import { User } from '../entities/user';
import { CreateUserRepoInput, UpdateUserRepoInput, UsersRepository } from '../repositories/users-repository';

export type CreateUserInput = Omit<CreateUserRepoInput, 'createdAt' | 'updatedAt' | 'id'> & { id?: string };
export type UpdateUserInput = Omit<UpdateUserRepoInput, 'createdAt' | 'updatedAt'>;

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
    const [existingEmail, existingId] = await Promise.all([
      this.findUserByEmail(input.email),
      input.id && this.usersRepo.findById(input.id),
    ]);

    if (existingEmail) {
      throw InvalidInputError.create({ field: 'email', reason: 'Email is already in use' });
    }

    if (existingId) {
      throw InvalidInputError.create({ field: 'id', reason: 'User ID is already in use' });
    }

    const now = new Date();
    const { id = randomUUID(), ...rest } = input;

    return this.usersRepo.create({ id, ...rest, createdAt: now, updatedAt: now });
  }

  async updateUser(id: string, input: UpdateUserInput): Promise<User> {
    await this.getUserById(id);
    const now = new Date();
    return this.usersRepo.updateById(id, { ...input, updatedAt: now });
  }

  async deactivateUser(id: string): Promise<User> {
    return this.updateUser(id, { isActive: false });
  }
}
