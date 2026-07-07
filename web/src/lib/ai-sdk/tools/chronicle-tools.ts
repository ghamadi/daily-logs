import { getObjectKeys } from '@daily-logs/utils/ts-utils';
import { getWorkspaceContextToolFactory } from './factories/get-workspace-context-tool-factory';
import { ToolsContext, ToolsFactory } from '@/lib/ai-sdk/tools/types';
import { InferUITools } from 'ai';

const CHRONICLE_TOOL_FACTORIES_REGISTRY = {
  'get-workspace-context': getWorkspaceContextToolFactory,
} as const satisfies Record<string, ToolsFactory>;

export type ChronicleToolFactoryRegistry = typeof CHRONICLE_TOOL_FACTORIES_REGISTRY;

export type ChronicleToolSet = {
  [K in keyof ChronicleToolFactoryRegistry]: ReturnType<ChronicleToolFactoryRegistry[K]>;
};

export type ChronicleTools = InferUITools<ChronicleToolSet>;

export function buildChronicleTools(context: ToolsContext) {
  const toolNames = getObjectKeys(CHRONICLE_TOOL_FACTORIES_REGISTRY);
  const entries = toolNames.map((toolName) => {
    const factory = CHRONICLE_TOOL_FACTORIES_REGISTRY[toolName];
    return [toolName, factory(context)] as const;
  });

  return Object.fromEntries(entries) as ChronicleToolSet;
}
