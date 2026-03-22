import { InvalidInputError } from '@domains/shared/errors/invalid-input-error';
import { AccessDeniedError } from '../../shared/errors/access-denied-error';
import { User } from '../entities/user';
import type { AuthIdentityLookup, IUsersRepository } from '../repositories/users-repository';
import type { AuthProvider } from '../value-objects/auth-provider';

export interface ResolveAuthenticatedPrincipalInput extends AuthIdentityLookup {
  email?: string | null;
  emailVerified: boolean;
  displayName?: string | null;
}

export interface AuthenticatedPrincipal {
  principalId: string;
  email: string;
  displayName: string;
  provider: AuthProvider;
  providerUserId: string;
}

export class UserIdentityService {
  constructor(private readonly usersRepo: IUsersRepository) {}

  async resolveAuthenticatedPrincipal(input: ResolveAuthenticatedPrincipalInput): Promise<AuthenticatedPrincipal> {
    const linkedUser = await this.usersRepo.findByAuthIdentity({
      provider: input.provider,
      providerUserId: input.providerUserId,
    });

    if (linkedUser) {
      this.assertUserIsActive(linkedUser);
      return this.toAuthenticatedPrincipal(linkedUser, input);
    }

    const email = input.email?.trim();
    if (!email) {
      throw new InvalidInputError('Authenticated user email is required to resolve a domain user.');
    }

    if (!input.emailVerified) {
      throw new AccessDeniedError('Authenticated user email must be verified before access is granted.');
    }

    const existingUser = await this.usersRepo.findByEmail(email);
    if (existingUser) {
      this.assertUserIsActive(existingUser);
      await this.usersRepo.linkAuthIdentity({
        userId: existingUser.id,
        provider: input.provider,
        providerUserId: input.providerUserId,
      });

      return this.toAuthenticatedPrincipal(existingUser, input);
    }

    const createdUser = await this.usersRepo.createWithAuthIdentity({
      email,
      displayName: input.displayName?.trim() || null,
      isActive: true,
      provider: input.provider,
      providerUserId: input.providerUserId,
    });

    return this.toAuthenticatedPrincipal(createdUser, input);
  }

  private assertUserIsActive(user: User): void {
    if (user.isDeactivated) {
      throw new AccessDeniedError('User account is deactivated.');
    }
  }

  private toAuthenticatedPrincipal(
    user: User,
    input: Pick<ResolveAuthenticatedPrincipalInput, 'provider' | 'providerUserId'>,
  ): AuthenticatedPrincipal {
    return {
      principalId: user.id,
      email: user.email,
      displayName: user.displayName,
      provider: input.provider,
      providerUserId: input.providerUserId,
    };
  }
}
