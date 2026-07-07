'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export type NewChatButtonProps = {
  workspaceId: string;
  variant?: 'default' | 'outline';
  label?: string;
};

export function NewChatButton(props: NewChatButtonProps) {
  const { workspaceId, variant = 'default', label = '+ New chat' } = props;

  return (
    <Button variant={variant} asChild>
      <Link href={`/workspaces/${workspaceId}/chats`}>{label}</Link>
    </Button>
  );
}
