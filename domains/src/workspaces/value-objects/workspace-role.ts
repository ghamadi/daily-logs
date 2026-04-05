import { type DbWorkspaceUserRole } from '@db/schema';
import { Enum } from '@utils/ts-utils';

export const WorkspaceRole = {
  MEMBER: 'member',
  ADMIN: 'admin',
  OWNER: 'owner',
} as const satisfies Record<string, DbWorkspaceUserRole>;
export type WorkspaceRole = Enum<typeof WorkspaceRole>;

export function isAdmin(role: WorkspaceRole): boolean {
  return role === WorkspaceRole.ADMIN;
}

export function isOwner(role: WorkspaceRole): boolean {
  return role === WorkspaceRole.OWNER;
}

export function hasAdminAccess(role: WorkspaceRole): boolean {
  return role === WorkspaceRole.ADMIN || role === WorkspaceRole.OWNER;
}
