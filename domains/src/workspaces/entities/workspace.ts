import type { DbWorkspace } from '@db/schema';

export type WorkspaceProps = DbWorkspace;

export class Workspace {
  readonly id: string;
  readonly name: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly ownerId;

  constructor(props: WorkspaceProps) {
    this.id = props.id;
    this.name = props.name;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.ownerId = props.ownerUserId;
  }

  isOwnedBy(userId: string): boolean {
    return this.ownerId === userId;
  }
}
