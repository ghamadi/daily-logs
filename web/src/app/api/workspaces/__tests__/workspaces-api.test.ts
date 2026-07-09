import { describe, expect, it, vi } from 'vitest';

import * as workspacesRoute from '@/app/api/workspaces/route';
import * as workspaceRoute from '@/app/api/workspaces/[workspaceId]/route';
import * as membersRoute from '@/app/api/workspaces/[workspaceId]/members/route';

import { authenticateAs, buildRequest, readApiData, routeContext } from '@test/server/helpers/api';
import { insertUser } from '@test/server/helpers/seed-data';

// Mock the auth seam so handlers run as whichever principal `authenticateAs` sets.
// The explicit factory keeps the real `auth.ts` (server-only) out of the graph.
vi.mock('@/lib/utils/api/auth', () => ({ getAuthenticatedPrincipal: vi.fn() }));

// Domain entities become plain JSON over the wire.
type WorkspaceJson = { id: string; name: string; ownerId: string };
type MemberJson = { id: string; workspaceId: string; role: string; user: { id: string; email: string } };

function createWorkspace(name: string) {
  return workspacesRoute.POST(buildRequest('/api/workspaces', { method: 'POST', body: { name } }));
}

function addMember(workspaceId: string, memberId: string, role?: 'member' | 'admin') {
  return membersRoute.POST(
    buildRequest(`/api/workspaces/${workspaceId}/members`, {
      method: 'POST',
      body: { memberId, ...(role ? { role } : {}) },
    }),
    routeContext({ workspaceId }),
  );
}

function listMembers(workspaceId: string) {
  return membersRoute.GET(
    buildRequest(`/api/workspaces/${workspaceId}/members`),
    routeContext({ workspaceId }),
  );
}

describe('workspaces API (integration)', () => {
  describe('POST & GET /api/workspaces', () => {
    it('creates a workspace and lists it for the owner', async () => {
      const owner = await insertUser();
      authenticateAs(owner);

      const createRes = await createWorkspace('Acme');
      expect(createRes.status).toBe(201);
      const created = await readApiData<WorkspaceJson>(createRes);
      expect(created).toMatchObject({ name: 'Acme', ownerId: owner.id });

      const listRes = await workspacesRoute.GET();
      expect(listRes.status).toBe(200);
      const list = await readApiData<WorkspaceJson[]>(listRes);
      expect(list.map((w) => w.id)).toEqual([created.id]);
    });

    it('rejects a blank name with 400', async () => {
      authenticateAs(await insertUser());

      const res = await createWorkspace('   ');
      expect(res.status).toBe(400);
    });
  });

  describe('cross-workspace isolation', () => {
    it("GET /api/workspaces returns only the caller's workspaces", async () => {
      const alice = await insertUser();
      const bob = await insertUser();

      authenticateAs(alice);
      const aliceWs = await readApiData<WorkspaceJson>(await createWorkspace('Alice WS'));

      authenticateAs(bob);
      await createWorkspace('Bob WS');

      const bobList = await readApiData<WorkspaceJson[]>(await workspacesRoute.GET());
      expect(bobList.map((w) => w.name)).toEqual(['Bob WS']);
      expect(bobList.map((w) => w.id)).not.toContain(aliceWs.id);
    });

    it('returns 404 when a non-member reads a workspace', async () => {
      const alice = await insertUser();
      const bob = await insertUser();

      authenticateAs(alice);
      const ws = await readApiData<WorkspaceJson>(await createWorkspace('Alice WS'));

      authenticateAs(bob);
      const res = await workspaceRoute.GET(
        buildRequest(`/api/workspaces/${ws.id}`),
        routeContext({ workspaceId: ws.id }),
      );
      expect(res.status).toBe(404);
    });
  });

  describe('membership authorization', () => {
    it('lets the owner add a member; members can list, outsiders cannot', async () => {
      const owner = await insertUser();
      const member = await insertUser();
      const outsider = await insertUser();

      authenticateAs(owner);
      const ws = await readApiData<WorkspaceJson>(await createWorkspace('Team'));

      const addRes = await addMember(ws.id, member.id, 'admin');
      expect(addRes.status).toBe(201);

      // Owner sees both members, with the creator recorded as OWNER.
      const ownerList = await readApiData<MemberJson[]>(await listMembers(ws.id));
      expect(ownerList.map((m) => m.user.id).sort()).toEqual([owner.id, member.id].sort());
      expect(ownerList.find((m) => m.user.id === owner.id)?.role).toBe('owner');

      // The added member can also list.
      authenticateAs(member);
      const memberList = await readApiData<MemberJson[]>(await listMembers(ws.id));
      expect(memberList).toHaveLength(2);

      // An outsider cannot (access-denied is masked as 404).
      authenticateAs(outsider);
      const outsiderRes = await listMembers(ws.id);
      expect(outsiderRes.status).toBe(404);
    });

    it('returns 404 when a non-owner tries to update a workspace', async () => {
      const owner = await insertUser();
      const member = await insertUser();

      authenticateAs(owner);
      const ws = await readApiData<WorkspaceJson>(await createWorkspace('Owned'));
      expect((await addMember(ws.id, member.id)).status).toBe(201);

      authenticateAs(member);
      const res = await workspaceRoute.PATCH(
        buildRequest(`/api/workspaces/${ws.id}`, { method: 'PATCH', body: { name: 'Renamed' } }),
        routeContext({ workspaceId: ws.id }),
      );
      expect(res.status).toBe(404);
    });

    it('returns 404 when a non-admin member tries to add a member', async () => {
      const owner = await insertUser();
      const member = await insertUser();
      const invitee = await insertUser();

      authenticateAs(owner);
      const ws = await readApiData<WorkspaceJson>(await createWorkspace('Team'));
      expect((await addMember(ws.id, member.id)).status).toBe(201); // joins as plain member

      authenticateAs(member);
      const res = await addMember(ws.id, invitee.id);
      expect(res.status).toBe(404);
    });
  });
});
