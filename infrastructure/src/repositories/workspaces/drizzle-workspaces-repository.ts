import { and, asc, eq, getTableColumns } from 'drizzle-orm';

import type { Database, Transaction } from '@db/client/create-db';
import { UsersTable, WorkspaceUsersTable, WorkspacesTable, type DbUser, type DbWorkspaceUser } from '@db/schema';
import { User } from '@domains/users/entities/user';
import { Workspace } from '@domains/workspaces/entities/workspace';
import type {
  CreateWorkspaceRepoInput,
  IWorkspacesRepository,
  UpdateWorkspaceRepoInput,
  WorkspaceMember,
} from '@domains/workspaces/repositories/workspaces-repository';
import { WorkspaceRole } from '@domains/workspaces/value-objects/workspace-role';
import { assertNotNullish } from '@utils/assertions';

type WorkspaceMemberRow = { member: DbWorkspaceUser; user: DbUser };

export class DrizzleWorkspacesRepository implements IWorkspacesRepository {
  constructor(private readonly db: Database) {}

  async findById(id: string): Promise<Workspace | null> {
    const rows = await this.db.select().from(WorkspacesTable).where(eq(WorkspacesTable.id, id)).limit(1);
    const row = rows[0];

    return row ? new Workspace(row) : null;
  }

  async listForUser(userId: string): Promise<Workspace[]> {
    const rows = await this.db
      .select(getTableColumns(WorkspacesTable))
      .from(WorkspacesTable)
      .innerJoin(WorkspaceUsersTable, eq(WorkspaceUsersTable.workspaceId, WorkspacesTable.id))
      .where(eq(WorkspaceUsersTable.userId, userId))
      .orderBy(asc(WorkspacesTable.name), asc(WorkspacesTable.id));

    return rows.map((row) => new Workspace(row));
  }

  async createWorkspaceWithOwner(input: CreateWorkspaceRepoInput): Promise<Workspace> {
    return this.db.transaction(async (tx: Transaction) => {
      const [workspaceRow] = await tx.insert(WorkspacesTable).values(input).returning();
      assertNotNullish(workspaceRow, `Failed to create workspace "${input.id}".`);

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
    const [row] = await this.db.update(WorkspacesTable).set(input).where(eq(WorkspacesTable.id, id)).returning();
    assertNotNullish(row, `Failed to update workspace "${id}".`);

    return new Workspace(row);
  }

  async deleteById(id: string): Promise<void> {
    await this.db.delete(WorkspacesTable).where(eq(WorkspacesTable.id, id));
  }

  async listMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const rows = await this.db
      .select({ member: getTableColumns(WorkspaceUsersTable), user: getTableColumns(UsersTable) })
      .from(WorkspaceUsersTable)
      .innerJoin(UsersTable, eq(UsersTable.id, WorkspaceUsersTable.userId))
      .where(eq(WorkspaceUsersTable.workspaceId, workspaceId))
      .orderBy(asc(WorkspaceUsersTable.createdAt), asc(WorkspaceUsersTable.userId));

    return rows.map(toWorkspaceMember);
  }

  async findMember(params: { workspaceId: string; memberId: string }): Promise<WorkspaceMember | null> {
    const [row = null] = await this.db
      .select({ member: getTableColumns(WorkspaceUsersTable), user: getTableColumns(UsersTable) })
      .from(WorkspaceUsersTable)
      .innerJoin(UsersTable, eq(UsersTable.id, WorkspaceUsersTable.userId))
      .where(
        and(
          eq(WorkspaceUsersTable.workspaceId, params.workspaceId),
          eq(WorkspaceUsersTable.userId, params.memberId),
        ),
      )
      .limit(1);

    return row && toWorkspaceMember(row);
  }

  async isMember(params: { workspaceId: string; memberId: string }): Promise<boolean> {
    const [row] = await this.db
      .select({ id: WorkspaceUsersTable.id })
      .from(WorkspaceUsersTable)
      .where(
        and(
          eq(WorkspaceUsersTable.workspaceId, params.workspaceId),
          eq(WorkspaceUsersTable.userId, params.memberId),
        ),
      )
      .limit(1);

    return row !== undefined;
  }

  async getOwner(params: { workspaceId: string }): Promise<WorkspaceMember> {
    const [row] = await this.db
      .select({
        workspace: WorkspacesTable,
        member: WorkspaceUsersTable,
        user: UsersTable,
      })
      .from(WorkspacesTable)
      .leftJoin(
        WorkspaceUsersTable,
        and(
          eq(WorkspaceUsersTable.workspaceId, WorkspacesTable.id),
          eq(WorkspaceUsersTable.role, WorkspaceRole.OWNER),
        ),
      )
      .leftJoin(UsersTable, eq(UsersTable.id, WorkspaceUsersTable.userId))
      .where(eq(WorkspacesTable.id, params.workspaceId))
      .limit(1);

    assertNotNullish(row, `Workspace "${params.workspaceId}" was not found.`);
    assertNotNullish(row.member, `Unexpected error: workspace "${params.workspaceId}" has no owner.`);
    assertNotNullish(row.user, `Unexpected error: owner user is missing for workspace "${params.workspaceId}".`);

    return toWorkspaceMember({ member: row.member, user: row.user });
  }

  async addMember(params: {
    workspaceId: string;
    memberId: string;
    role: WorkspaceRole;
  }): Promise<WorkspaceMember> {
    const [insertedRow] = await this.db
      .insert(WorkspaceUsersTable)
      .values({
        workspaceId: params.workspaceId,
        userId: params.memberId,
        role: params.role,
      })
      .returning({ id: WorkspaceUsersTable.id });

    assertNotNullish(
      insertedRow,
      `Failed to add member "${params.memberId}" to workspace "${params.workspaceId}".`,
    );

    return this.loadMemberById(insertedRow.id);
  }

  async updateRole(params: {
    workspaceId: string;
    memberId: string;
    role: WorkspaceRole;
  }): Promise<WorkspaceMember> {
    const [updatedRow] = await this.db
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
      .returning({ id: WorkspaceUsersTable.id });

    assertNotNullish(
      updatedRow,
      `Failed to update member "${params.memberId}" in workspace "${params.workspaceId}".`,
    );

    return this.loadMemberById(updatedRow.id);
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

  // ── helpers ──────────────────────────────────────────────

  private async loadMemberById(memberRowId: string): Promise<WorkspaceMember> {
    const [row] = await this.db
      .select({ member: getTableColumns(WorkspaceUsersTable), user: getTableColumns(UsersTable) })
      .from(WorkspaceUsersTable)
      .innerJoin(UsersTable, eq(UsersTable.id, WorkspaceUsersTable.userId))
      .where(eq(WorkspaceUsersTable.id, memberRowId))
      .limit(1);

    assertNotNullish(row, `Failed to load workspace member with id "${memberRowId}".`);

    return toWorkspaceMember(row);
  }
}

function toWorkspaceMember(row: WorkspaceMemberRow): WorkspaceMember {
  return {
    id: row.member.id,
    workspaceId: row.member.workspaceId,
    role: row.member.role,
    user: new User(row.user),
    createdAt: row.member.createdAt,
    updatedAt: row.member.updatedAt,
  };
}
