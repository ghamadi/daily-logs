import { WorkspaceRole } from '@db-exports/enums';

export { WorkspaceRole };

export function isAdmin(role: WorkspaceRole): boolean {
  return role === WorkspaceRole.Admin;
}

export function isOwner(role: WorkspaceRole): boolean {
  return role === WorkspaceRole.Owner;
}

export function hasAdminAccess(role: WorkspaceRole): boolean {
  return role === WorkspaceRole.Admin || role === WorkspaceRole.Owner;
}
