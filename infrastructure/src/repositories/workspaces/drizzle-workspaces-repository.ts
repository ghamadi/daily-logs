import { and, asc, eq } from 'drizzle-orm';

import type { Database, Transaction } from '@db/client/create-db';
import { WorkspaceUsersTable, WorkspacesTable, type DbWorkspaceUser } from '@db/schema';
import { Workspace } from '@domains/workspaces/entities/workspace';
import type {
  CreateWorkspaceRepoInput,
  IWorkspacesRepository,
  UpdateWorkspaceRepoInput,
  WorkspaceMember,
} from '@domains/workspaces/repositories/workspaces-repository';
import { WorkspaceRole } from '@domains/workspaces/value-objects/workspace-role';

import { requireRecord } from '../../shared/require-record';

function toWorkspaceMember(row: DbWorkspaceUser): WorkspaceMember {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    userId: row.userId,
    role: row.role,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleWorkspacesRepository implements IWorkspacesRepository {
  constructor(private readonly db: Database) {}

  async findById(id: string): Promise<Workspace | null> {
    const rows = await this.db.select().from(WorkspacesTable).where(eq(WorkspacesTable.id, id)).limit(1);
    const row = rows[0];

    return row ? new Workspace(row) : null;
  }

  async createWorkspaceWithOwner(input: CreateWorkspaceRepoInput): Promise<Workspace> {
    return this.db.transaction(async (tx: Transaction) => {
      const workspaceRows = await tx.insert(WorkspacesTable).values(input).returning();
      const workspaceRow = requireRecord(workspaceRows[0], `Failed to create workspace "${input.id}".`);

      await tx.insert(WorkspaceUsersTable).values({
        workspaceId: workspaceRow.id,
        userId: workspaceRow.ownerUserId,
        role: WorkspaceRole.OWNER,
        createdAt: workspaceRow.createdAt,
        updatedAt: workspaceRow.updatedAt,
      });

      return new Workspace(workspaceRow);
    });
  }

  async updateById(id: string, input: UpdateWorkspaceRepoInput): Promise<Workspace> {
    const rows = await this.db.update(WorkspacesTable).set(input).where(eq(WorkspacesTable.id, id)).returning();
    const row = requireRecord(rows[0], `Failed to update workspace "${id}".`);

    return new Workspace(row);
  }

  async deleteById(id: string): Promise<void> {
    await this.db.delete(WorkspacesTable).where(eq(WorkspacesTable.id, id));
  }

  async listMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const rows = await this.db
      .select()
      .from(WorkspaceUsersTable)
      .where(eq(WorkspaceUsersTable.workspaceId, workspaceId))
      .orderBy(asc(WorkspaceUsersTable.createdAt), asc(WorkspaceUsersTable.userId));

    return rows.map(toWorkspaceMember);
  }

  async findMember(params: { workspaceId: string; memberId: string }): Promise<WorkspaceMember | null> {
    const rows = await this.db
      .select()
      .from(WorkspaceUsersTable)
      .where(
        and(
          eq(WorkspaceUsersTable.workspaceId, params.workspaceId),
          eq(WorkspaceUsersTable.userId, params.memberId),
        ),
      )
      .limit(1);

    const row = rows[0];

    return row ? toWorkspaceMember(row) : null;
  }

  async getMember(params: { workspaceId: string; memberId: string }): Promise<WorkspaceMember> {
    const member = await this.findMember(params);

    return requireRecord(
      member,
      `Workspace member "${params.memberId}" not found in workspace "${params.workspaceId}".`,
    );
  }

  async getOwner(params: { workspaceId: string }): Promise<WorkspaceMember> {
    const rows = await this.db
      .select()
      .from(WorkspaceUsersTable)
      .where(
        and(
          eq(WorkspaceUsersTable.workspaceId, params.workspaceId),
          eq(WorkspaceUsersTable.role, WorkspaceRole.OWNER),
        ),
      )
      .limit(1);

    const row = requireRecord(rows[0], `Workspace owner not found for workspace "${params.workspaceId}".`);

    return toWorkspaceMember(row);
  }

  async addMember(params: {
    workspaceId: string;
    memberId: string;
    role: WorkspaceRole;
  }): Promise<WorkspaceMember> {
    const rows = await this.db
      .insert(WorkspaceUsersTable)
      .values({
        workspaceId: params.workspaceId,
        userId: params.memberId,
        role: params.role,
      })
      .returning();

    const row = requireRecord(
      rows[0],
      `Failed to add member "${params.memberId}" to workspace "${params.workspaceId}".`,
    );

    return toWorkspaceMember(row);
  }

  async updateRole(params: {
    workspaceId: string;
    memberId: string;
    role: WorkspaceRole;
  }): Promise<WorkspaceMember> {
    const rows = await this.db
      .update(WorkspaceUsersTable)
      .set({
        role: params.role,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(WorkspaceUsersTable.workspaceId, params.workspaceId),
          eq(WorkspaceUsersTable.userId, params.memberId),
        ),
      )
      .returning();

    const row = requireRecord(
      rows[0],
      `Failed to update member "${params.memberId}" in workspace "${params.workspaceId}".`,
    );

    return toWorkspaceMember(row);
  }

  async removeMember(params: { workspaceId: string; memberId: string }): Promise<void> {
    await this.db
      .delete(WorkspaceUsersTable)
      .where(
        and(
          eq(WorkspaceUsersTable.workspaceId, params.workspaceId),
          eq(WorkspaceUsersTable.userId, params.memberId),
        ),
      );
  }
}
