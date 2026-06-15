'use client';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip';

// Scratch page to verify open-order layer stacking. Not part of the app.
export default function LayerDemoPage() {
  return (
    <TooltipProvider>
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
        <h1 className="text-lg font-medium">Layer stacking demo</h1>

        <Dialog>
          <Dialog.Trigger asChild>
            <Button data-testid="open-a">Open Dialog A</Button>
          </Dialog.Trigger>
          <Dialog.Content className="bg-amber-50">
            <Dialog.Header>
              <Dialog.Title>Dialog A</Dialog.Title>
              <Dialog.Description>
                Hover the button for a tooltip (should float above this dialog), and open Dialog B
                (should cover this dialog).
              </Dialog.Description>
            </Dialog.Header>

            <div className="flex gap-3">
              <Tooltip>
                <Tooltip.Trigger asChild>
                  <Button variant="outline" data-testid="hover-me">
                    Hover me
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Content>Tooltip above Dialog A</Tooltip.Content>
              </Tooltip>

              <Dialog>
                <Dialog.Trigger asChild>
                  <Button data-testid="open-b">Open Dialog B</Button>
                </Dialog.Trigger>
                <Dialog.Content className="bg-sky-100">
                  <Dialog.Header>
                    <Dialog.Title>Dialog B</Dialog.Title>
                    <Dialog.Description>
                      Opened from inside Dialog A — this must render on top of Dialog A.
                    </Dialog.Description>
                  </Dialog.Header>
                </Dialog.Content>
              </Dialog>
            </div>
          </Dialog.Content>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
