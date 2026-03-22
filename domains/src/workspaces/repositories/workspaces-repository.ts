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
  userId: string;
  role: WorkspaceRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorkspacesRepository {
  findById(id: string): Promise<Workspace | null>;
  createWorkspaceWithOwner(input: CreateWorkspaceRepoInput): Promise<Workspace>;
  updateById(id: string, input: UpdateWorkspaceRepoInput): Promise<Workspace>;
  deleteById(id: string): Promise<void>;

  listMembers(workspaceId: string): Promise<WorkspaceMember[]>;
  findMember(params: { workspaceId: string; memberId: string }): Promise<WorkspaceMember | null>;
  getMember(params: { workspaceId: string; memberId: string }): Promise<WorkspaceMember>;
  getOwner(params: { workspaceId: string }): Promise<WorkspaceMember>;
  addMember(params: { workspaceId: string; memberId: string; role: WorkspaceRole }): Promise<WorkspaceMember>;
  updateRole(params: { workspaceId: string; memberId: string; role: WorkspaceRole }): Promise<WorkspaceMember>;
  removeMember(params: { workspaceId: string; memberId: string }): Promise<void>;
}
