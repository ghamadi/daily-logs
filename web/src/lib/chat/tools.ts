import { tool, type InferUITools, type ToolSet } from 'ai';
import { z } from 'zod';
import { WorkspacesService } from '@domains/workspaces/services/workspaces-service';

export type ChatToolContext = {
  workspaceId: string;
  workspacesService: WorkspacesService;
};

/**
 * Builds the chat tool registry, closing each tool's `execute`
 * over the server-provided `ChatToolContext`.
 */
export function buildChatTools(context: ChatToolContext) {
  const { workspaceId, workspacesService } = context;

  return {
    getWorkspaceContext: tool({
      description:
        "Returns information about the current workspace, such as its display name. Call this when the user asks about the active workspace, or when you'd otherwise need to refer to it by name.",
      inputSchema: z.object({}),
      async execute() {
        const workspace = await workspacesService.findById(workspaceId);
        if (!workspace) {
          // The principal's workspace membership is verified before this tool
          // is built, so this only happens if the workspace was deleted
          // mid-conversation. Surface as a tool error so the model can react.
          throw new Error('The active workspace is no longer available.');
        }
        return { name: workspace.name };
      },
    }),
  } satisfies ToolSet;
}

/** Inferred shape of the chat tool registry (input/output schemas only). */
export type ChatToolSet = ReturnType<typeof buildChatTools>;

/**
 * UI-message tool shape inferred from `ChatToolSet`. Used as the third generic
 * to `UIMessage` so persisted tool-invocation parts are typed end-to-end.
 */
export type ChatTools = InferUITools<ChatToolSet>;
