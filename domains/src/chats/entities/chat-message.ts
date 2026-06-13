import type { DbChatMessage, StoredUiMessage } from '@daily-logs/db/schema';
import { DomainErrors } from '@domains/lib/errors';

export type ChatMessageProps<TPayload extends StoredUiMessage = StoredUiMessage> = Omit<
  DbChatMessage,
  'payload'
> & { payload: TPayload };

export class ChatMessage<TPayload extends StoredUiMessage = StoredUiMessage> {
  readonly id: string;
  readonly chatId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly payload: TPayload;

  constructor(props: ChatMessageProps<TPayload>) {
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
