import { convertToModelMessages, ModelMessage, ToolSet, UIMessage, validateUIMessages } from 'ai';
import { v7 as uuidV7 } from 'uuid';

// ===============================================================
// PARSE MESSAGES
// ===============================================================

export type ParseMessagesResult<TData extends UIMessage | ModelMessage> =
  | {
      success: true;
      reason?: undefined;
      data: { messages: TData[] };
    }
  | {
      success: false;
      reason: string;
      data?: undefined;
    };

export async function parseUiMessages<TPayload extends UIMessage, TTools extends ToolSet>(params: {
  messages: unknown[];
  tools: TTools;
}): Promise<ParseMessagesResult<TPayload>> {
  try {
    const { messages, tools } = params;

    const uiMessages = await validateUIMessages<TPayload>({
      messages,
      tools,
    });

    return {
      success: true,
      data: { messages: uiMessages },
    };
  } catch (error) {
    return {
      success: false,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function parseModelMessages<TPayload extends UIMessage, TTools extends ToolSet>(params: {
  messages: TPayload[];
  tools: TTools;
}): Promise<ParseMessagesResult<ModelMessage>> {
  const { messages, tools } = params;

  try {
    const modelMessages = await convertToModelMessages(messages, { tools });

    return {
      success: true,
      data: { messages: modelMessages },
    };
  } catch (error) {
    return {
      success: false,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

// ===============================================================
// Extract Error Message
// ===============================================================

export function logAndExtractAiGenerationErrorMessage(error: unknown) {
  console.error('Error Response Generation: ', error);
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'string' && error.length > 0) {
    return error;
  }
  return 'An error occurred while generating the response.';
}

// ===============================================================
// Generate Message ID
// ===============================================================

export function generateMessageId() {
  return uuidV7();
}
