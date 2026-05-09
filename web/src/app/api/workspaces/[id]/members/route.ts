import { NextRequest } from 'next/server';
import { z } from 'zod';

import { WorkspaceMember } from '@domains/workspaces/repositories/workspaces-repository';
import { WorkspacesService } from '@domains/workspaces/services/workspaces-service';
import { WorkspaceRole } from '@domains/workspaces/value-objects/workspace-role';
import { getDb } from '@infrastructure/db/get-db';
import { DrizzleWorkspacesRepository } from '@infrastructure/repositories/workspaces/drizzle-workspaces-repository';
import { getAuthenticatedPrincipal } from '@web/lib/utils/api/auth';
import { translateAccessDeniedToNotFound, withApiErrorHandler } from '@web/lib/utils/api/errors';
import { parseJsonBody } from '@web/lib/utils/api/request';
import { ApiResponse, toApiResponse } from '@web/lib/utils/api/response';

// ========================================================
// GET /api/workspaces/[id]/members
// ========================================================

const GETParamsSchema = z.object({
  id: z.uuid('Workspace id must be a valid UUID.'),
});

export type ListWorkspaceMembersRequestParams = z.infer<typeof GETParamsSchema>;

export type ListWorkspaceMembersResponseBody = ApiResponse<WorkspaceMember[]>;

export const GET = withApiErrorHandler(
  async (_request: NextRequest, context: RouteContext<'/api/workspaces/[id]/members'>) => {
    const { id } = GETParamsSchema.parse(await context.params);
    const principal = await getAuthenticatedPrincipal();

    const service = new WorkspacesService(new DrizzleWorkspacesRepository(getDb()));

    const members = await service
      .listMembers({ workspaceId: id, principalId: principal.id })
      .catch((error) =>
        translateAccessDeniedToNotFound(error, `Could not find workspace with id "${id}".`),
      );

    return toApiResponse(members);
  },
);

// ========================================================
// POST /api/workspaces/[id]/members
// ========================================================

const POSTParamsSchema = z.object({
  id: z.uuid('Workspace id must be a valid UUID.'),
});

// Owner role is intentionally excluded — ownership cannot be assigned through member management.
const ASSIGNABLE_ROLES = [WorkspaceRole.MEMBER, WorkspaceRole.ADMIN] as const;

const POSTBodySchema = z.object({
  memberId: z.uuid('Member id must be a valid UUID.'),
  role: z.enum(ASSIGNABLE_ROLES).optional(),
});

export type AddWorkspaceMemberRequestParams = z.infer<typeof POSTParamsSchema>;

export type AddWorkspaceMemberRequestBody = z.infer<typeof POSTBodySchema>;

export type AddWorkspaceMemberResponseBody = ApiResponse<WorkspaceMember>;

export const POST = withApiErrorHandler(
  async (request: NextRequest, context: RouteContext<'/api/workspaces/[id]/members'>) => {
    const { id } = POSTParamsSchema.parse(await context.params);
    const principal = await getAuthenticatedPrincipal();
    const { memberId, role } = await parseJsonBody(request, POSTBodySchema);

    const service = new WorkspacesService(new DrizzleWorkspacesRepository(getDb()));

    const member = await service
      .addMember({ workspaceId: id, principalId: principal.id, memberId, role })
      .catch((error) =>
        translateAccessDeniedToNotFound(error, `Could not find workspace with id "${id}".`),
      );

    return toApiResponse(member, { responseInit: { status: 201 } });
  },
);
