import { randomUUID } from 'crypto';

import { AccessDeniedError } from '../../shared/errors/access-denied-error';
import { EntityNotFoundError } from '../../shared/errors/entity-not-found-error';
import { InvalidInputError } from '../../shared/errors/invalid-input-error';
import { Workspace } from '../entities/workspace';
import {
  CreateWorkspaceRepoInput,
  UpdateWorkspaceRepoInput,
  WorkspaceMember,
  IWorkspacesRepository,
} from '../repositories/workspaces-repository';
import { hasAdminAccess, isOwner, WorkspaceRole } from '../value-objects/workspace-role';

export type CreateWorkspaceInput = Omit<CreateWorkspaceRepoInput, 'createdAt' | 'updatedAt' | 'id'> & {
  id?: string;
};
export type UpdateWorkspaceInput = Omit<UpdateWorkspaceRepoInput, 'updatedAt'>;

export class WorkspacesService {
  constructor(private readonly workspacesRepo: IWorkspacesRepository) {}

  findWorkspaceById(id: string): Promise<Workspace | null> {
    return this.workspacesRepo.findById(id);
  }

  async getWorkspaceById(props: { id: string; principalId: string }): Promise<Workspace> {
    const { id, principalId } = props;
    const workspace = await this.findWorkspaceById(id);
    if (!workspace) {
      throw EntityNotFoundError.create({ entity: 'Workspace', identifier: id });
    }
    await this.requireMembership(id, principalId);
    return workspace;
  }

  async createWorkspaceWithOwner(input: CreateWorkspaceInput): Promise<Workspace> {
    if (input.id) {
      const existingWorkspace = await this.findWorkspaceById(input.id);
      if (existingWorkspace) {
        throw InvalidInputError.create({ field: 'id', reason: 'Workspace ID is already in use' });
      }
    }

    const now = new Date();
    const { id = randomUUID(), ...rest } = input;
    return this.workspacesRepo.createWorkspaceWithOwner({
      id,
      ...rest,
      createdAt: now,
      updatedAt: now,
    });
  }

  async updateWorkspace(props: {
    id: string;
    principalId: string;
    input: UpdateWorkspaceInput;
  }): Promise<Workspace> {
    const { id, principalId, input } = props;
    const workspace = await this.getWorkspaceById({ id, principalId });
    if (!workspace.isOwnedBy(principalId)) {
      throw new AccessDeniedError('Only workspace owner can update workspace settings');
    }

    return this.workspacesRepo.updateById(id, { ...input, updatedAt: new Date() });
  }

  async deleteWorkspace(props: { id: string; principalId: string }): Promise<void> {
    const { id, principalId } = props;
    const workspace = await this.getWorkspaceById({ id, principalId });
    if (!workspace.isOwnedBy(principalId)) {
      throw new AccessDeniedError('Only workspace owner can delete this workspace');
    }
    await this.workspacesRepo.deleteById(id);
  }

  async listMembers(props: { workspaceId: string; principalId: string }): Promise<WorkspaceMember[]> {
    const { workspaceId, principalId } = props;
    await this.requireMembership(workspaceId, principalId);
    return this.workspacesRepo.listMembers(workspaceId);
  }

  async getMember(props: {
    workspaceId: string;
    principalId: string;
    memberId: string;
  }): Promise<WorkspaceMember> {
    const { workspaceId, principalId, memberId } = props;
    await this.requireMembership(workspaceId, principalId);
    return this.getMemberOrThrow({ workspaceId, memberId });
  }

  async addMember(props: {
    workspaceId: string;
    principalId: string;
    memberId: string;
    role?: WorkspaceRole;
  }): Promise<WorkspaceMember> {
    const { workspaceId, principalId, memberId, role = WorkspaceRole.MEMBER } = props;
    await this.requireAdminAccess(workspaceId, principalId);
    this.assertRoleCanBeManaged({ newRole: role });

    const existingMember = await this.workspacesRepo.findMember({ workspaceId, memberId });
    if (existingMember) {
      throw InvalidInputError.create({ field: 'memberId', reason: 'User is already a member of this workspace' });
    }

    return this.workspacesRepo.addMember({ workspaceId, memberId, role });
  }

  async updateMemberRole(props: {
    workspaceId: string;
    principalId: string;
    memberId: string;
    role: WorkspaceRole;
  }): Promise<WorkspaceMember> {
    const { workspaceId, principalId, memberId, role } = props;
    const [member] = await Promise.all([
      this.getMemberOrThrow({ workspaceId, memberId }),
      this.requireAdminAccess(workspaceId, principalId),
    ]);

    this.assertRoleCanBeManaged({ currentRole: member.role, newRole: role });

    return this.workspacesRepo.updateRole({ workspaceId, memberId, role });
  }

  async removeMember(props: { workspaceId: string; principalId: string; memberId: string }): Promise<void> {
    const { workspaceId, principalId, memberId } = props;
    await this.requireAdminAccess(workspaceId, principalId);

    const member = await this.getMemberOrThrow({ workspaceId, memberId });
    if (isOwner(member.role)) {
      throw InvalidInputError.create({ field: 'memberId', reason: 'Workspace owner cannot be removed' });
    }

    await this.workspacesRepo.removeMember({ workspaceId, memberId });
  }

  async leaveWorkspace(props: { workspaceId: string; principalId: string }): Promise<void> {
    const { workspaceId, principalId } = props;
    const member = await this.requireMembership(workspaceId, principalId);
    if (isOwner(member.role)) {
      throw InvalidInputError.create({ field: 'principalId', reason: 'Workspace owner cannot leave workspace' });
    }

    await this.workspacesRepo.removeMember({ workspaceId, memberId: principalId });
  }

  // ── helpers ──────────────────────────────────────────────

  private assertRoleCanBeManaged(props: { currentRole?: WorkspaceRole; newRole: WorkspaceRole }): void {
    const { currentRole, newRole } = props;
    if (isOwner(newRole)) {
      throw InvalidInputError.create({
        field: 'role',
        reason: 'Owner role cannot be assigned through member management.',
      });
    }

    if (currentRole === WorkspaceRole.OWNER) {
      throw InvalidInputError.create({ field: 'role', reason: 'Workspace owner role cannot be changed.' });
    }
  }

  private async requireMembership(workspaceId: string, memberId: string): Promise<WorkspaceMember> {
    const member = await this.workspacesRepo.findMember({ workspaceId, memberId });
    if (!member) {
      throw new AccessDeniedError('User is not a member of this workspace');
    }
    return member;
  }

  private async requireAdminAccess(workspaceId: string, memberId: string): Promise<WorkspaceMember> {
    const member = await this.requireMembership(workspaceId, memberId);
    if (!hasAdminAccess(member.role)) {
      throw new AccessDeniedError('User does not have admin access in this workspace');
    }
    return member;
  }

  private async getMemberOrThrow(props: { workspaceId: string; memberId: string }): Promise<WorkspaceMember> {
    const { workspaceId, memberId } = props;
    const member = await this.workspacesRepo.findMember({ workspaceId, memberId });
    if (!member) {
      throw EntityNotFoundError.create({ entity: 'Workspace member', identifier: memberId });
    }
    return member;
  }
}
