import type { DbChatMessage } from '@daily-logs/db/schema';
import { DomainErrors } from '@domains/lib/errors';

export type ChatMessageRole = DbChatMessage['role'];

export type ChatMessagePayload = DbChatMessage['payload'];

export type ChatMessageParams = Omit<DbChatMessage, 'createdAt' | 'updatedAt'> & {
  createdAt?: Date;
  updatedAt?: Date;
};

export class ChatMessage {
  readonly id: string;
  readonly chatId: string;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
  readonly role: ChatMessageRole;
  readonly payload: ChatMessagePayload;

  constructor(props: ChatMessageParams) {
    if (props.id !== props.payload.id) {
      throw new DomainErrors.InvalidInputError(
        'Message id mismatch. Message id must be the same as the payload id.',
      );
    }

    if (props.role !== props.payload.role) {
      throw new DomainErrors.InvalidInputError(
        'Message role mismatch. Message role must be the same as the payload role.',
      );
    }

    this.id = props.id;
    this.chatId = props.chatId;
    this.role = props.role;
    this.payload = props.payload;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static fromPayload(params: ChatMessagePayload & { chatId: string }): ChatMessage {
    const { chatId, ...payload } = params;
    const id = payload.id;
    const role = payload.role;

    return new ChatMessage({ id, chatId, role, payload });
  }
}
