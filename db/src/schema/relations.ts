import { relations } from 'drizzle-orm';

import { EventsDataTable } from './events-data-table';
import { EventsTable } from './events-table';
import { MessagesTable } from './messages-table';
import { UsersTable } from './users-table';
import { WorkspaceUsersTable } from './workspace-users-table';
import { WorkspacesTable } from './workspaces-table';

export const UsersRelations = relations(UsersTable, ({ many }) => ({
  workspaceUsers: many(WorkspaceUsersTable),
  messages: many(MessagesTable),
  events: many(EventsTable),
}));

export const WorkspacesRelations = relations(WorkspacesTable, ({ many, one }) => ({
  owner: one(UsersTable, { fields: [WorkspacesTable.ownerUserId], references: [UsersTable.id] }),
  members: many(WorkspaceUsersTable),
  messages: many(MessagesTable),
  events: many(EventsTable),
}));

export const WorkspaceUsersRelations = relations(WorkspaceUsersTable, ({ one }) => ({
  workspace: one(WorkspacesTable, { fields: [WorkspaceUsersTable.workspaceId], references: [WorkspacesTable.id] }),
  user: one(UsersTable, { fields: [WorkspaceUsersTable.userId], references: [UsersTable.id] }),
}));

export const MessagesRelations = relations(MessagesTable, ({ one, many }) => ({
  workspace: one(WorkspacesTable, { fields: [MessagesTable.workspaceId], references: [WorkspacesTable.id] }),
  user: one(UsersTable, { fields: [MessagesTable.userId], references: [UsersTable.id] }),
  events: many(EventsTable),
}));

export const EventsRelations = relations(EventsTable, ({ one }) => ({
  workspace: one(WorkspacesTable, { fields: [EventsTable.workspaceId], references: [WorkspacesTable.id] }),
  user: one(UsersTable, { fields: [EventsTable.userId], references: [UsersTable.id] }),
  message: one(MessagesTable, { fields: [EventsTable.messageId], references: [MessagesTable.id] }),
  data: one(EventsDataTable, { fields: [EventsTable.id], references: [EventsDataTable.eventId] }),
}));

export const EventsDataRelations = relations(EventsDataTable, ({ one }) => ({
  event: one(EventsTable, { fields: [EventsDataTable.eventId], references: [EventsTable.id] }),
}));
