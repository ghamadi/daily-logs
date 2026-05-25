import type { DbChatMessage } from '@db/schema';
import { DomainErrors } from '@domains/lib/errors';
import type { UiMessagePayload } from '@web/lib/ai-sdk/types';

export type ChatMessageProps = DbChatMessage;

export class ChatMessage {
  readonly id: string;
  readonly chatId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  private readonly payload: UiMessagePayload;

  constructor(props: ChatMessageProps) {
    if (props.id !== props.payload.id) {
      throw new DomainErrors.UnexpectedError('Message id mismatch');
    }

    this.id = props.id;
    this.chatId = props.chatId;
    this.payload = props.payload;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  get role() {
    return this.payload.role;
  }

  get parts() {
    return this.payload.parts;
  }

  get metadata() {
    return this.payload.metadata;
  }
}
