'use client';

import { useChatContext } from '@/app/(main)/workspaces/[workspaceId]/_components/chat-context-provider';
import { PromptComposer } from '@/app/(main)/workspaces/[workspaceId]/chats/_components/prompt-composer';
import { useParams, useRouter } from 'next/navigation';
import { v4 as uuidV4 } from 'uuid';

export default function NewChatPage() {
  const { setInitialPrompt } = useChatContext();
  const router = useRouter();
  const { workspaceId } = useParams();

  const handleSubmit = (message: string) => {
    const randomId = uuidV4();
    console.warn(randomId, message);
    setInitialPrompt(message);
    router.push(`/workspaces/${workspaceId}/chats/${randomId}`);
  };

  return (
    <div className="-mt-10 flex h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-4xl">
        <PromptComposer onSubmit={(message) => handleSubmit(message.text)} onStop={() => {}} />
      </div>
    </div>
  );
}
