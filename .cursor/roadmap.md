# Daily-Logs Delivery Plan (Revised: Phase 1 Includes Full RBAC + Testing Foundation)

## Summary

Deliver a staging-deployable working product by with:

1. Timeline (core CRUD + filters + status flow).
2. Guided AI chat window (proposal + explicit confirm).
3. Personal finance module with **full double-entry accounting**.
4. First report: **monthly cashflow + category spend**.
5. Explicit role support in Phase 1:

- `System Admin` (global)
- `Workspace Owner`
- `Workspace Admin`
- `Workspace Member`

6. Testing foundation in Week 1:

- **Vitest + React Testing Library + Playwright**
- **Postgres-only integration tests** (local and CI)

## High-Level Phased Path

| Phase   | Goal                                            | Outcome                                                                                            | Exit Criteria                                                       |
| ------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Phase 1 | First working product with scalable foundations | Timeline + guided chat + double-entry finance + report + RBAC + test framework + staging readiness | End-to-end in staging with role-based permissions enforced          |
| Phase 2 | Broaden life modules                            | Nutrition + workouts, richer chat extraction, better report UX                                     | Additional modules run on same architecture without contract breaks |
| Phase 3 | Collaboration depth                             | Kids rewards module, stronger member workflows, cross-module trend reporting                       | Stable multi-member behavior with clear privilege boundaries        |
| Phase 4 | Scale + automation                              | Performance tuning (projections where needed), automation/integrations, mobile API hardening       | Measured performance and maintainable operational model             |

## Phase 1 Detailed Plan

### Week-by-Week Timeline

| Week   | Deliverables                                                                                                            |
| ------ | ----------------------------------------------------------------------------------------------------------------------- |
| Week 1 | Foundation: schema/domain reconciliation, RBAC model (including system admin), API scaffolding, testing framework setup |
| Week 2 | Timeline backend + UI, role-enforced CRUD/status endpoints, filters/pagination                                          |
| Week 3 | Finance double-entry backend + timeline linkage, role-enforced finance APIs                                             |
| Week 4 | Guided AI chat flow + finance reporting module                                                                          |
| Week 5 | Stabilization: full test coverage targets, staging hardening, release readiness checks                                  |

---

### Workstream A: Foundation (Week 1)

1. **Reconcile current data model drift**

- Align `db` schema, migrations, and `domains` entities/repositories.
- Ensure `events` model consistently supports timeline and chat-linked actions.

2. **Add Phase 1 RBAC baseline**

- Keep existing workspace role model (`Owner/Admin/Member`).
- Add global system-role model in DB (`system_admin` source of truth).
- Create centralized auth context resolver for all API routes.

3. **Define and enforce privilege matrix**

- `System Admin`: global cross-workspace access + admin APIs.
- `Workspace Owner`: full workspace control including settings and membership authority.
- `Workspace Admin`: workspace operational management, but no owner-only destructive actions.
- `Workspace Member`: standard usage permissions (create/read/update own data per module rules).

4. **Testing foundation setup**

- Add monorepo test scripts and baseline config for:
  - Vitest (unit/integration),
  - React Testing Library (component behavior),
  - Playwright (critical E2E smoke).
- Postgres-only integration environment:
  - local test DB via Docker Compose,
  - CI service container Postgres for integration jobs.
- Add CI gates: lint, typecheck, unit, integration, E2E smoke, build.

5. **API contract and error-handling framework**

- Add API error abstraction and route wrapper that maps domain errors consistently.
- Add auth + authorization guard helpers used by all route handlers.

---

### Workstream B: Timeline Module (Weeks 2-3)

1. Implement repository adapters in web for events/workspace membership checks.
2. Build timeline APIs:

- create/read/update,
- confirm/reject,
- date/type/status filters,
- pagination.

3. Build timeline UI in protected area with filter controls and event state actions.
4. Enforce role matrix on all timeline operations.

---

### Workstream C: Finance Module (Weeks 3-4)

1. Add `finances` domain package structure (entities/repositories/services/value objects/exports).
2. Implement full double-entry schema and posting service with hard invariants:

- balanced journal entries required,
- transaction -> postings mapping,
- account/category support.

3. Add finance APIs for accounts/categories/transactions/report queries.
4. Link finance transaction posting to timeline event creation.
5. Enforce RBAC for finance actions and visibility.

---

### Workstream D: Guided AI Chat (Week 4)

1. Chat UI panel: session list/thread, input box, assistant responses, confirmation cards.
2. Chat backend:

- create session,
- send message,
- receive `proposedActions`,
- confirm action endpoint.

3. Writes only happen on explicit user confirmation.
4. Confirmed actions execute domain services and update timeline/report data.

---

### Workstream E: Reporting Module (Weeks 4-5)

1. Build finance report queries directly on normalized finance tables:

- monthly cashflow (income/expense/net),
- category spend breakdown.

2. Build reporting UI with period selector and chart/table view.
3. Add report test fixtures and deterministic validation queries.

---

### Workstream F: Staging Readiness (Week 5)

1. Add seed data scripts for realistic demo scenarios.
2. Add release checklist and rollback/migration verification steps.
3. Run full staging smoke for all critical flows.
4. Document known limitations and phase-2 carryovers.

## Public APIs / Interfaces / Types (Important Changes)

1. **RBAC additions**

- New DB schema for global system role authority.
- New auth context shape used by APIs:
  - `principal.userId`
  - `principal.systemRole`
  - `principal.workspaceRole` (per workspace)

1. **Timeline endpoints**

- `GET/POST /api/timeline/events`
- `PATCH /api/timeline/events/:id`
- `POST /api/timeline/events/:id/confirm`
- `POST /api/timeline/events/:id/reject`

1. **Finance endpoints**

- `GET/POST /api/finance/accounts`
- `GET/POST /api/finance/categories`
- `POST /api/finance/transactions`
- `GET /api/finance/reports/cashflow`
- `GET /api/finance/reports/category-spend`

1. **Chat endpoints**

- `POST /api/chat/sessions`
- `GET /api/chat/sessions/:id/messages`
- `POST /api/chat/sessions/:id/messages`
- `POST /api/chat/sessions/:id/actions/:actionId/confirm`

1. **Admin endpoints (Phase 1 minimal)**

- system-admin scoped operational endpoints for role/workspace administration (API first; admin UI can remain minimal in phase 1).

## Test Cases and Scenarios

### Unit

1. Journal posting fails when debits/credits are unbalanced.
2. Timeline status transitions only allow valid state changes.
3. Permission helpers return correct allow/deny across all four roles.

### Integration (Postgres)

1. Timeline CRUD + filters/pagination return expected rows.
2. Finance transaction writes balanced postings and linked timeline event.
3. Cashflow/category report matches seeded ledger totals.
4. Chat confirm flow persists intended records only after confirmation.
5. Role enforcement validates:

- system admin cross-workspace access,
- owner-only actions,
- admin-limited actions,
- member constraints.

### E2E Smoke (Playwright)

1. Login -> protected dashboard.
2. Create timeline item manually -> visible with correct filters.
3. Chat propose finance transaction -> confirm -> visible in timeline + report.
4. Unauthorized action attempts are blocked in UI/API behavior.

## Assumptions and Defaults Chosen

1. Phase 1 includes full role differentiation with DB-backed global system admin.
2. Product UX remains single-user-first while keeping multi-role/multi-workspace architecture active.
3. AI chat is guided logging only (not broad assistant scope yet).
4. Reporting reads normalized module tables first; projection tables are deferred unless profiling proves need.
5. Testing stack is Vitest + RTL + Playwright with Postgres-only integration fidelity.
6. Staging-deployable is the release bar for Phase 1.
