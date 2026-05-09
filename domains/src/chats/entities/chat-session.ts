import type { DbChatSession } from '@db/schema';

export type ChatSessionProps = DbChatSession;

export class ChatSession {
  readonly id: string;
  readonly workspaceId: string;
  readonly ownerUserId: string;
  readonly title: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly archivedAt: Date | null;

  constructor(props: ChatSessionProps) {
    this.id = props.id;
    this.workspaceId = props.workspaceId;
    this.ownerUserId = props.ownerUserId;
    this.title = props.title;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.archivedAt = props.archivedAt;
  }

  get isArchived(): boolean {
    return this.archivedAt !== null;
  }

  isOwnedBy(userId: string): boolean {
    return this.ownerUserId === userId;
  }
}
