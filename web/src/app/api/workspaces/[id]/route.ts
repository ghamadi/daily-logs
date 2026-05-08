import { NextRequest } from 'next/server';
import { z } from 'zod';

import { WorkspacesService } from '@domains/workspaces/services/workspaces-service';
import { getDb } from '@infrastructure/db/get-db';
import { DrizzleWorkspacesRepository } from '@infrastructure/repositories/workspaces/drizzle-workspaces-repository';
import { getAuthenticatedPrincipal } from '@web/lib/utils/api/auth';
import { withApiErrorHandler } from '@web/lib/utils/api/errors';
import { ApiResponse, toApiResponse } from '@web/lib/utils/api/response';
import { DomainErrors } from '@domains/lib/errors';
import { Workspace } from '@domains/workspaces/entities/workspace';

// ========================================================
// GET /api/workspaces/[id]
// ========================================================

const GETParamsSchema = z.object({
  id: z.uuid('Workspace id must be a valid UUID.'),
});

export type GetWorkspaceByIdRequestParams = z.infer<typeof GETParamsSchema>;

export type GetWorkspaceByIdResponseBody = ApiResponse<Workspace>;

export const GET = withApiErrorHandler(
  async (_request: NextRequest, context: RouteContext<'/api/workspaces/[id]'>) => {
    const { id } = GETParamsSchema.parse(await context.params);
    const principal = await getAuthenticatedPrincipal();

    const service = new WorkspacesService(new DrizzleWorkspacesRepository(getDb()));

    const workspace = await service.getWorkspaceById({ id, principalId: principal.id }).catch((error) => {
      if (error instanceof DomainErrors.AccessDeniedError) {
        throw new DomainErrors.NotFoundError('Workspace not found', { id });
      }
      throw error;
    });

    return toApiResponse(workspace);
  },
);
