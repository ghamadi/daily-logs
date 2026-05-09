import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { WorkspacesService } from '@domains/workspaces/services/workspaces-service';
import { getDb } from '@infrastructure/db/get-db';
import { DrizzleWorkspacesRepository } from '@infrastructure/repositories/workspaces/drizzle-workspaces-repository';
import { getAuthenticatedPrincipal } from '@web/lib/utils/api/auth';
import { translateAccessDeniedToNotFound, withApiErrorHandler } from '@web/lib/utils/api/errors';
import { parseJsonBody } from '@web/lib/utils/api/request';
import { ApiResponse, toApiResponse } from '@web/lib/utils/api/response';
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

    const workspace = await service
      .getWorkspaceById({ id, principalId: principal.id })
      .catch((error) =>
        translateAccessDeniedToNotFound(error, `Could not find workspace with id "${id}".`),
      );

    return toApiResponse(workspace);
  },
);

// ========================================================
// PATCH /api/workspaces/[id]
// ========================================================

const PATCHParamsSchema = z.object({
  id: z.uuid('Workspace id must be a valid UUID.'),
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
  async (request: NextRequest, context: RouteContext<'/api/workspaces/[id]'>) => {
    const { id } = PATCHParamsSchema.parse(await context.params);
    const principal = await getAuthenticatedPrincipal();
    const updates = await parseJsonBody(request, PATCHBodySchema);

    const service = new WorkspacesService(new DrizzleWorkspacesRepository(getDb()));

    const workspace = await service
      .updateWorkspace({ id, principalId: principal.id, input: updates })
      .catch((error) =>
        translateAccessDeniedToNotFound(error, `Could not update workspace with id "${id}".`),
      );

    return toApiResponse(workspace);
  },
);

// ========================================================
// DELETE /api/workspaces/[id]
// ========================================================

const DELETEParamsSchema = z.object({
  id: z.uuid('Workspace id must be a valid UUID.'),
});

export const DELETE = withApiErrorHandler(
  async (_request: NextRequest, context: RouteContext<'/api/workspaces/[id]'>) => {
    const { id } = DELETEParamsSchema.parse(await context.params);
    const principal = await getAuthenticatedPrincipal();

    const service = new WorkspacesService(new DrizzleWorkspacesRepository(getDb()));

    await service
      .deleteWorkspace({ id, principalId: principal.id })
      .catch((error) =>
        translateAccessDeniedToNotFound(error, `Could not find workspace with id "${id}".`),
      );

    return new NextResponse(null, { status: 204 });
  },
);
