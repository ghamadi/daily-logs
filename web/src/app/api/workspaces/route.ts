import { NextRequest } from 'next/server';
import { z } from 'zod';

import { WorkspacesService } from '@domains/workspaces/services/workspaces-service';
import { getDb } from '@infrastructure/db/get-db';
import { DrizzleWorkspacesRepository } from '@infrastructure/repositories/workspaces/drizzle-workspaces-repository';
import { getAuthenticatedPrincipal } from '@web/lib/utils/api/auth';
import { withApiErrorHandler } from '@web/lib/utils/api/errors';
import { parseJsonBody } from '@web/lib/utils/api/request';
import { ApiResponse, toApiResponse } from '@web/lib/utils/api/response';
import { Workspace } from '@domains/workspaces/entities/workspace';

// ========================================================
// POST /api/workspaces
// ========================================================

const POSTBodySchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(160, 'Name must be 160 characters or fewer.'),
});

export type CreateWorkspaceRequestBody = z.infer<typeof POSTBodySchema>;

export type CreateWorkspaceResponseBody = ApiResponse<Workspace>;

export const POST = withApiErrorHandler(async (request: NextRequest) => {
  const principal = await getAuthenticatedPrincipal();
  const { name } = await parseJsonBody(request, POSTBodySchema);

  const service = new WorkspacesService(new DrizzleWorkspacesRepository(getDb()));
  const workspace = await service.createWorkspaceWithOwner({
    name,
    ownerUserId: principal.id,
  });

  return toApiResponse(workspace, { responseInit: { status: 201 } });
});

// ========================================================
// GET /api/workspaces
// ========================================================

export type ListWorkspacesResponseBody = ApiResponse<Workspace[]>;

export const GET = withApiErrorHandler(async () => {
  const principal = await getAuthenticatedPrincipal();

  const service = new WorkspacesService(new DrizzleWorkspacesRepository(getDb()));
  const workspaces = await service.listWorkspacesForUser(principal.id);

  return toApiResponse(workspaces);
});
