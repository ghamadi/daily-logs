import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { WorkspacesService } from '@domains/workspaces/services/workspaces-service';
import { getDb } from '@infrastructure/db/get-db';
import { DrizzleWorkspacesRepository } from '@infrastructure/repositories/workspaces/drizzle-workspaces-repository';
import { getAuthenticatedPrincipal } from '@/lib/utils/api/auth';
import { translateAccessDeniedToNotFoundAndThrow, withApiErrorHandler } from '@/lib/utils/api/errors';
import { parseJsonBody } from '@/lib/utils/api/request';
import { ApiResponse, toApiResponse } from '@/lib/utils/api/response';
import { Workspace } from '@domains/workspaces/entities/workspace';

// ========================================================
// GET /api/workspaces/[workspaceId]
// ========================================================

const GETParamsSchema = z.object({
  workspaceId: z.uuid('Workspace id must be a valid UUID.'),
});

export type GetWorkspaceByIdRequestParams = z.infer<typeof GETParamsSchema>;

export type GetWorkspaceByIdResponseBody = ApiResponse<Workspace>;

export const GET = withApiErrorHandler(
  async (_request: NextRequest, context: RouteContext<'/api/workspaces/[workspaceId]'>) => {
    const { workspaceId } = GETParamsSchema.parse(await context.params);
    const principal = await getAuthenticatedPrincipal();

    const service = new WorkspacesService(new DrizzleWorkspacesRepository(getDb()));

    const workspace = await service
      .getWorkspaceById({ id: workspaceId, principalId: principal.id })
      .catch((error) =>
        translateAccessDeniedToNotFoundAndThrow(
          error,
          `Could not find workspace with id "${workspaceId}".`,
        ),
      );

    return toApiResponse(workspace);
  },
);

// ========================================================
// PATCH /api/workspaces/[workspaceId]
// ========================================================

const PATCHParamsSchema = z.object({
  workspaceId: z.uuid('Workspace id must be a valid UUID.'),
});

const PATCHBodySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Name is required.')
      .max(160, 'Name must be 160 characters or fewer.')
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update.',
  });

export type UpdateWorkspaceRequestBody = z.infer<typeof PATCHBodySchema>;

export type UpdateWorkspaceResponseBody = ApiResponse<Workspace>;

export const PATCH = withApiErrorHandler(
  async (request: NextRequest, context: RouteContext<'/api/workspaces/[workspaceId]'>) => {
    const { workspaceId } = PATCHParamsSchema.parse(await context.params);
    const principal = await getAuthenticatedPrincipal();
    const updates = await parseJsonBody(request, PATCHBodySchema);

    const service = new WorkspacesService(new DrizzleWorkspacesRepository(getDb()));

    const workspace = await service
      .updateWorkspace({ id: workspaceId, principalId: principal.id, input: updates })
      .catch((error) =>
        translateAccessDeniedToNotFoundAndThrow(
          error,
          `Could not update workspace with id "${workspaceId}".`,
        ),
      );

    return toApiResponse(workspace);
  },
);

// ========================================================
// DELETE /api/workspaces/[workspaceId]
// ========================================================

const DELETEParamsSchema = z.object({
  workspaceId: z.uuid('Workspace id must be a valid UUID.'),
});

export const DELETE = withApiErrorHandler(
  async (_request: NextRequest, context: RouteContext<'/api/workspaces/[workspaceId]'>) => {
    const { workspaceId } = DELETEParamsSchema.parse(await context.params);
    const principal = await getAuthenticatedPrincipal();

    const service = new WorkspacesService(new DrizzleWorkspacesRepository(getDb()));

    await service
      .deleteWorkspace({ id: workspaceId, principalId: principal.id })
      .catch((error) =>
        translateAccessDeniedToNotFoundAndThrow(
          error,
          `Could not find workspace with id "${workspaceId}".`,
        ),
      );

    return new NextResponse(null, { status: 204 });
  },
);
