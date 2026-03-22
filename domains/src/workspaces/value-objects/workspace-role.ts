import { Enum } from '@utils/ts-utils';

export const WorkspaceRole = {
  Unknown: 0,
  Member: 1,
  Admin: 2,
  Owner: 3,
} as const;
export type WorkspaceRole = Enum<typeof WorkspaceRole>;

export function isAdmin(role: WorkspaceRole): boolean {
  return role === WorkspaceRole.Admin;
}

export function isOwner(role: WorkspaceRole): boolean {
  return role === WorkspaceRole.Owner;
}

export function hasAdminAccess(role: WorkspaceRole): boolean {
  return role === WorkspaceRole.Admin || role === WorkspaceRole.Owner;
}
