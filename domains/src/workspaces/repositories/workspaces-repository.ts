import { User } from '@domains/users/entities/user';
import { WorkspaceRole } from '@domains/workspaces/value-objects/workspace-role';
import { Workspace, WorkspaceProps } from '../entities/workspace';

export type CreateWorkspaceRepoInput = WorkspaceProps;
export type UpdateWorkspaceRepoInput = Partial<
  Omit<CreateWorkspaceRepoInput, 'id' | 'ownerUserId' | 'createdAt'>
> & {
  updatedAt: Date;
};

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  role: WorkspaceRole;
  user: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorkspacesRepository {
  findById(id: string): Promise<Workspace | null>;
  listForUser(userId: string): Promise<Workspace[]>;
  createWorkspaceWithOwner(input: CreateWorkspaceRepoInput): Promise<Workspace>;
  updateById(id: string, input: UpdateWorkspaceRepoInput): Promise<Workspace>;
  deleteById(id: string): Promise<void>;

  listMembers(workspaceId: string): Promise<WorkspaceMember[]>;
  findMember(params: { workspaceId: string; memberId: string }): Promise<WorkspaceMember | null>;
  isMember(params: { workspaceId: string; memberId: string }): Promise<boolean>;
  getOwner(params: { workspaceId: string }): Promise<WorkspaceMember>;
  addMember(params: { workspaceId: string; memberId: string; role: WorkspaceRole }): Promise<WorkspaceMember>;
  updateRole(params: { workspaceId: string; memberId: string; role: WorkspaceRole }): Promise<WorkspaceMember>;
  removeMember(params: { workspaceId: string; memberId: string }): Promise<void>;
}
