import { relations } from 'drizzle-orm';

import { EventsTable } from './events-table';
import { UsersTable } from './users-table';
import { WorkspaceUsersTable } from './workspace-users-table';
import { WorkspacesTable } from './workspaces-table';

export const UsersRelations = relations(UsersTable, ({ many }) => ({
  workspaceUsers: many(WorkspaceUsersTable),
  events: many(EventsTable),
}));

export const WorkspacesRelations = relations(WorkspacesTable, ({ many, one }) => ({
  owner: one(UsersTable, { fields: [WorkspacesTable.ownerUserId], references: [UsersTable.id] }),
  members: many(WorkspaceUsersTable),
  events: many(EventsTable),
}));

export const WorkspaceUsersRelations = relations(WorkspaceUsersTable, ({ one }) => ({
  workspace: one(WorkspacesTable, { fields: [WorkspaceUsersTable.workspaceId], references: [WorkspacesTable.id] }),
  user: one(UsersTable, { fields: [WorkspaceUsersTable.userId], references: [UsersTable.id] }),
}));

export const EventsRelations = relations(EventsTable, ({ one }) => ({
  workspace: one(WorkspacesTable, { fields: [EventsTable.workspaceId], references: [WorkspacesTable.id] }),
  user: one(UsersTable, { fields: [EventsTable.userId], references: [UsersTable.id] }),
}));
