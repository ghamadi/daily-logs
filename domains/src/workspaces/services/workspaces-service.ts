import { randomUUID } from 'crypto';
import {
  CreateWorkspaceRepoInput,
  UpdateWorkspaceRepoInput,
  IWorkspacesRepository,
} from '../repositories/workspaces-repository';
import { hasAdminAccess, isOwner, WorkspaceRole } from '../value-objects/workspace-role';
import { DomainErrors } from '@domains/lib/errors';

export type CreateWorkspaceInput = Omit<CreateWorkspaceRepoInput, 'createdAt' | 'updatedAt' | 'id'> & {
  id?: string;
};
export type UpdateWorkspaceInput = Omit<UpdateWorkspaceRepoInput, 'updatedAt'>;

export class WorkspacesService {
  constructor(private readonly workspacesRepo: IWorkspacesRepository) {}

  findWorkspaceById(id: string) {
    return this.workspacesRepo.findById(id);
  }

  listWorkspacesForUser(userId: string) {
    return this.workspacesRepo.listForUser(userId);
  }

  async getWorkspaceById(props: { id: string; principalId: string }) {
    const { id, principalId } = props;
    const workspace = await this.findWorkspaceById(id);
    if (!workspace) {
      throw new DomainErrors.NotFoundError('Workspace not found', { id });
    }
    await this.requireMembership(id, principalId);
    return workspace;
  }

  async createWorkspaceWithOwner(input: CreateWorkspaceInput) {
    if (input.id) {
      const existingWorkspace = await this.findWorkspaceById(input.id);
      if (existingWorkspace) {
        throw new DomainErrors.InvalidInputError('Workspace with this ID already exists', { id: input.id });
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

  async updateWorkspace(props: { id: string; principalId: string; input: UpdateWorkspaceInput }) {
    const { id, principalId, input } = props;
    const workspace = await this.getWorkspaceById({ id, principalId });
    if (!workspace.isOwnedBy(principalId)) {
      throw new DomainErrors.AccessDeniedError('Only workspace owner can update workspace settings');
    }

    return this.workspacesRepo.updateById(id, { ...input, updatedAt: new Date() });
  }

  async deleteWorkspace(props: { id: string; principalId: string }) {
    const { id, principalId } = props;
    const workspace = await this.getWorkspaceById({ id, principalId });
    if (!workspace.isOwnedBy(principalId)) {
      throw new DomainErrors.AccessDeniedError('Only workspace owner can delete this workspace');
    }
    await this.workspacesRepo.deleteById(id);
  }

  async listMembers(props: { workspaceId: string; principalId: string }) {
    const { workspaceId, principalId } = props;
    await this.requireMembership(workspaceId, principalId);
    return this.workspacesRepo.listMembers(workspaceId);
  }

  async getMember(props: { workspaceId: string; principalId: string; memberId: string }) {
    const { workspaceId, principalId, memberId } = props;
    await this.requireMembership(workspaceId, principalId);
    return this.getMemberOrThrow({ workspaceId, memberId });
  }

  async addMember(props: { workspaceId: string; principalId: string; memberId: string; role?: WorkspaceRole }) {
    const { workspaceId, principalId, memberId, role = WorkspaceRole.MEMBER } = props;
    await this.requireAdminAccess(workspaceId, principalId);
    this.assertRoleCanBeManaged({ newRole: role });

    const existingMember = await this.workspacesRepo.findMember({ workspaceId, memberId });
    if (existingMember) {
      throw new DomainErrors.InvalidInputError('User is already a member of this workspace');
    }

    return await this.workspacesRepo.addMember({ workspaceId, memberId, role });
  }

  async updateMemberRole(props: {
    workspaceId: string;
    principalId: string;
    memberId: string;
    role: WorkspaceRole;
  }) {
    const { workspaceId, principalId, memberId, role } = props;
    const [member] = await Promise.all([
      this.getMemberOrThrow({ workspaceId, memberId }),
      this.requireAdminAccess(workspaceId, principalId),
    ]);

    this.assertRoleCanBeManaged({ currentRole: member.role, newRole: role });

    return this.workspacesRepo.updateRole({ workspaceId, memberId, role });
  }

  async removeMember(props: { workspaceId: string; principalId: string; memberId: string }) {
    const { workspaceId, principalId, memberId } = props;
    await this.requireAdminAccess(workspaceId, principalId);

    const member = await this.getMemberOrThrow({ workspaceId, memberId });
    if (isOwner(member.role)) {
      throw new DomainErrors.InvalidInputError('Workspace owner cannot be removed');
    }

    await this.workspacesRepo.removeMember({ workspaceId, memberId });
  }

  async leaveWorkspace(props: { workspaceId: string; principalId: string }) {
    const { workspaceId, principalId } = props;
    const member = await this.workspacesRepo.findMember({ workspaceId, memberId: principalId });
    if (!member) {
      throw new DomainErrors.AccessDeniedError('User is not a member of this workspace');
    }
    if (isOwner(member.role)) {
      throw new DomainErrors.InvalidInputError('Workspace owner cannot leave workspace');
    }

    await this.workspacesRepo.removeMember({ workspaceId, memberId: principalId });
  }

  // ── helpers ──────────────────────────────────────────────

  private assertRoleCanBeManaged(props: { currentRole?: WorkspaceRole; newRole: WorkspaceRole }): void {
    const { currentRole, newRole } = props;
    if (isOwner(newRole)) {
      throw new DomainErrors.InvalidInputError('Owner role cannot be assigned through member management.');
    }

    if (currentRole === WorkspaceRole.OWNER) {
      throw new DomainErrors.InvalidInputError('Workspace owner role cannot be changed.');
    }
  }

  private async requireMembership(workspaceId: string, memberId: string): Promise<void> {
    const isMember = await this.workspacesRepo.isMember({ workspaceId, memberId });
    if (!isMember) {
      throw new DomainErrors.AccessDeniedError('User is not a member of this workspace');
    }
  }

  private async requireAdminAccess(workspaceId: string, memberId: string) {
    const member = await this.workspacesRepo.findMember({ workspaceId, memberId });
    if (!member) {
      throw new DomainErrors.AccessDeniedError('User is not a member of this workspace');
    }
    if (!hasAdminAccess(member.role)) {
      throw new DomainErrors.AccessDeniedError('User does not have admin access in this workspace');
    }
    return member;
  }

  private async getMemberOrThrow(props: { workspaceId: string; memberId: string }) {
    const { workspaceId, memberId } = props;
    const member = await this.workspacesRepo.findMember({ workspaceId, memberId });
    if (!member) {
      throw new DomainErrors.NotFoundError('Workspace member not found', { memberId });
    }
    return member;
  }
}
