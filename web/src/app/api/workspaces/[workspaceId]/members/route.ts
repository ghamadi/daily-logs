import { NextRequest } from 'next/server';
import { z } from 'zod';

import { WorkspaceMember } from '@domains/workspaces/repositories/workspaces-repository';
import { WorkspacesService } from '@domains/workspaces/services/workspaces-service';
import { WorkspaceRole } from '@domains/workspaces/value-objects/workspace-role';
import { getDb } from '@infrastructure/db/get-db';
import { DrizzleWorkspacesRepository } from '@infrastructure/repositories/workspaces/drizzle-workspaces-repository';
import { getAuthenticatedPrincipal } from '@/lib/utils/api/auth';
import { translateAccessDeniedToNotFoundAndThrow, withApiErrorHandler } from '@/lib/utils/api/errors';
import { parseJsonBody } from '@/lib/utils/api/request';
import { ApiResponse, toApiResponse } from '@/lib/utils/api/response';

// ========================================================
// GET /api/workspaces/[workspaceId]/members
// ========================================================

const GETParamsSchema = z.object({
  workspaceId: z.uuid('Workspace id must be a valid UUID.'),
});

export type ListWorkspaceMembersRequestParams = z.infer<typeof GETParamsSchema>;

export type ListWorkspaceMembersResponseBody = ApiResponse<WorkspaceMember[]>;

export const GET = withApiErrorHandler(
  async (_request: NextRequest, context: RouteContext<'/api/workspaces/[workspaceId]/members'>) => {
    const { workspaceId } = GETParamsSchema.parse(await context.params);
    const principal = await getAuthenticatedPrincipal();

    const service = new WorkspacesService(new DrizzleWorkspacesRepository(getDb()));

    const members = await service
      .listMembers({ workspaceId, principalId: principal.id })
      .catch((error) =>
        translateAccessDeniedToNotFoundAndThrow(
          error,
          `Could not find workspace with id "${workspaceId}".`,
        ),
      );

    return toApiResponse(members);
  },
);

// ========================================================
// POST /api/workspaces/[workspaceId]/members
// ========================================================

const POSTParamsSchema = z.object({
  workspaceId: z.uuid('Workspace id must be a valid UUID.'),
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
  async (request: NextRequest, context: RouteContext<'/api/workspaces/[workspaceId]/members'>) => {
    const { workspaceId } = POSTParamsSchema.parse(await context.params);
    const principal = await getAuthenticatedPrincipal();
    const { memberId, role } = await parseJsonBody(request, POSTBodySchema);

    const service = new WorkspacesService(new DrizzleWorkspacesRepository(getDb()));

    const member = await service
      .addMember({ workspaceId, principalId: principal.id, memberId, role })
      .catch((error) =>
        translateAccessDeniedToNotFoundAndThrow(
          error,
          `Could not find workspace with id "${workspaceId}".`,
        ),
      );

    return toApiResponse(member, { responseInit: { status: 201 } });
  },
);
