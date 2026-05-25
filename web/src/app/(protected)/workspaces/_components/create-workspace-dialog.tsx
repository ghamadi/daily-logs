'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { type SubmitEvent, useState } from 'react';

import type { Workspace } from '@domains/workspaces/entities/workspace';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { CreateWorkspaceRequestBody } from '@/app/api/workspaces/route';
import { apiFetch } from '@/lib/api/client';

export function CreateWorkspaceDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  const mutation = useMutation({
    mutationFn: (input: CreateWorkspaceRequestBody) =>
      apiFetch<Workspace>('/api/workspaces', { method: 'POST', body: input }),
    onSuccess: () => {
      // Workspaces are server-rendered; refresh the segment so the new row
      // shows up. Once we have a `useQuery` for the list we can switch to
      // `queryClient.invalidateQueries({ queryKey: ['workspaces'] })`.
      router.refresh();
      setName('');
      setOpen(false);
    },
  });

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setName('');
      mutation.reset();
    }
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    mutation.mutate({ name: trimmed });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <Button>+ New workspace</Button>
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Create workspace</Dialog.Title>
          <Dialog.Description>
            Workspaces group chats and (later) timeline events. You&apos;ll be the owner.
          </Dialog.Description>
        </Dialog.Header>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="workspace-name">Name</Label>
            <input
              id="workspace-name"
              type="text"
              autoFocus
              required
              maxLength={160}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Personal"
              className="border-border bg-background focus-visible:ring-ring/40 h-9 rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
            />
          </div>
          {mutation.error && <p className="text-destructive text-xs">{mutation.error.message}</p>}
          <Dialog.Footer>
            <Dialog.Close asChild>
              <Button type="button" variant="outline" disabled={mutation.isPending}>
                Cancel
              </Button>
            </Dialog.Close>
            <Button type="submit" disabled={!name.trim() || mutation.isPending}>
              {mutation.isPending ? <LoadingSpinner className="size-4" /> : 'Create'}
            </Button>
          </Dialog.Footer>
        </form>
      </Dialog.Content>
    </Dialog>
  );
}
