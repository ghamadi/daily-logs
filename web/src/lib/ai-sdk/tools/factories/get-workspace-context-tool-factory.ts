import { ToolsContext, ToolsFactory } from '@/lib/ai-sdk/tools/types';
import { tool } from 'ai';
import z from 'zod';

export const getWorkspaceContextToolFactory: ToolsFactory = (_ctx: ToolsContext) => {
  return tool({
    description: 'Returns information about the current workspace',
    inputSchema: z.object({}),
    outputSchema: z.object({
      name: z.string(),
    }),
    execute: async () => {
      return { name: '' };
    },
  });
};
