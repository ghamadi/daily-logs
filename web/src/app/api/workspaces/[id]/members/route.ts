import { NextRequest } from 'next/server';
import { z } from 'zod';

import { WorkspaceMember } from '@domains/workspaces/repositories/workspaces-repository';
import { WorkspacesService } from '@domains/workspaces/services/workspaces-service';
import { getDb } from '@infrastructure/db/get-db';
import { DrizzleWorkspacesRepository } from '@infrastructure/repositories/workspaces/drizzle-workspaces-repository';
import { getAuthenticatedPrincipal } from '@web/lib/utils/api/auth';
import { translateAccessDeniedToNotFound, withApiErrorHandler } from '@web/lib/utils/api/errors';
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
      .catch((error) => translateAccessDeniedToNotFound(error, `Could not find workspace with id "${id}".`));

    return toApiResponse(members);
  },
);
