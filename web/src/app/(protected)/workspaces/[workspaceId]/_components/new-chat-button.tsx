'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import type { Chat } from '@domains/chats/entities/chat-session';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { apiFetch } from '@/lib/api/client';

export type NewChatButtonProps = {
  workspaceId: string;
  variant?: 'default' | 'outline';
  label?: string;
};

export function NewChatButton(props: NewChatButtonProps) {
  const { workspaceId, variant = 'default', label = '+ New chat' } = props;
  const router = useRouter();

  const mutation = useMutation({
    // No variables: the chat is unconditionally created untitled — the title
    // is editable later via the `PATCH` route once we have UI for it.
    mutationFn: () =>
      apiFetch<Chat>(`/api/workspaces/${workspaceId}/chats`, {
        method: 'POST',
        body: {},
      }),
    onSuccess: (chat) => {
      // Hard-navigate to the new chat. The chat page is server-rendered so
      // it hydrates from the DB on its own — no cache priming needed here.
      router.push(`/workspaces/${workspaceId}/chats/${chat.id}`);
    },
  });

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} variant={variant}>
        {mutation.isPending ? <LoadingSpinner className="size-4" /> : label}
      </Button>
      {mutation.error && <span className="text-destructive text-xs">{mutation.error.message}</span>}
    </div>
  );
}
