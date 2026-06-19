'use client';

import { Button } from '@/components/ui/button';
import { HoverCard } from '@/components/ui/hover-card';

export default function HoverCardDemoPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-lg font-medium">Hover card demo</h1>

      <HoverCard>
        <HoverCard.Trigger asChild>
          <Button variant="outline">Hover me</Button>
        </HoverCard.Trigger>
        <HoverCard.Content>
          <div className="flex flex-col gap-1">
            <p className="font-medium">Daily Logs</p>
            <p className="text-muted-foreground">
              A hover card shown after a short delay, anchored to its trigger.
            </p>
          </div>
        </HoverCard.Content>
      </HoverCard>
    </div>
  );
}
