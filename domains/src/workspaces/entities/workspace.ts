export interface WorkspaceProps {
  id: string;
  ownerUserId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Workspace {
  readonly id: string;
  readonly ownerUserId: string;
  readonly name: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: WorkspaceProps) {
    this.id = props.id;
    this.ownerUserId = props.ownerUserId;
    this.name = props.name;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  isOwnedBy(userId: string): boolean {
    return this.ownerUserId === userId;
  }
}
