import { relations } from 'drizzle-orm';
import { AuthIdentitiesTable } from './tables/auth-identities-table';
import { ChatMessagesTable } from './tables/chat-messages-table';
import { ChatSessionsTable } from './tables/chat-sessions-table';
import { EventsTable } from './tables/events-table';
import { UsersTable } from './tables/users-table';
import { WorkspaceUsersTable } from './tables/workspace-users-table';
import { WorkspacesTable } from './tables/workspaces-table';

export const UsersRelations = relations(UsersTable, ({ many }) => ({
  authIdentities: many(AuthIdentitiesTable),
  workspaceUsers: many(WorkspaceUsersTable),
  events: many(EventsTable),
  chatSessions: many(ChatSessionsTable),
}));

export const AuthIdentitiesRelations = relations(AuthIdentitiesTable, ({ one }) => ({
  user: one(UsersTable, { fields: [AuthIdentitiesTable.userId], references: [UsersTable.id] }),
}));

export const WorkspacesRelations = relations(WorkspacesTable, ({ many, one }) => ({
  owner: one(UsersTable, { fields: [WorkspacesTable.ownerUserId], references: [UsersTable.id] }),
  members: many(WorkspaceUsersTable),
  events: many(EventsTable),
  chatSessions: many(ChatSessionsTable),
}));

export const WorkspaceUsersRelations = relations(WorkspaceUsersTable, ({ one }) => ({
  workspace: one(WorkspacesTable, {
    fields: [WorkspaceUsersTable.workspaceId],
    references: [WorkspacesTable.id],
  }),
  user: one(UsersTable, { fields: [WorkspaceUsersTable.userId], references: [UsersTable.id] }),
}));

export const EventsRelations = relations(EventsTable, ({ one }) => ({
  workspace: one(WorkspacesTable, {
    fields: [EventsTable.workspaceId],
    references: [WorkspacesTable.id],
  }),
  user: one(UsersTable, { fields: [EventsTable.userId], references: [UsersTable.id] }),
}));

export const ChatSessionsRelations = relations(ChatSessionsTable, ({ one, many }) => ({
  workspace: one(WorkspacesTable, {
    fields: [ChatSessionsTable.workspaceId],
    references: [WorkspacesTable.id],
  }),
  owner: one(UsersTable, {
    fields: [ChatSessionsTable.ownerUserId],
    references: [UsersTable.id],
  }),
  messages: many(ChatMessagesTable),
}));

export const ChatMessagesRelations = relations(ChatMessagesTable, ({ one }) => ({
  session: one(ChatSessionsTable, {
    fields: [ChatMessagesTable.sessionId],
    references: [ChatSessionsTable.id],
  }),
}));
