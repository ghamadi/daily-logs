import { ChronicleTools } from '@/lib/ai-sdk/tools/chronicle-tools';
import { UIMessage } from 'ai';

export type ChronicleMessagePayload = UIMessage<unknown, never, ChronicleTools>;
