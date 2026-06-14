import { ToolsRuntime } from '@/lib/ai-sdk/tools/tools-runtime';
import { Tool } from 'ai';

export type ToolsContext = {
  chatId: string;
  workspaceId: string;
  principalId: string;
  runtime: ToolsRuntime;
};

export type ToolsFactory = (context: ToolsContext) => Tool;
