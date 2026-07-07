'use client';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

export default function ToasterDemoPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-lg font-medium">Toaster demo</h1>

      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={() => toast.success('Item saved successfully')}>Success</Button>
        <Button onClick={() => toast.error('Something went wrong')}>Error</Button>
        <Button onClick={() => toast.info('New message received')}>Info</Button>
        <Button onClick={() => toast.warning('Action may be irreversible')}>Warning</Button>
        <Button onClick={() => toast.loading('Working on it…')}>Loading</Button>
        <Button variant="outline" onClick={() => toast('Default toast message')}>Default</Button>
        <Button
          variant="outline"
          onClick={() =>
            toast.promise(new Promise((resolve) => setTimeout(resolve, 2000)), {
              loading: 'Processing…',
              success: 'All done!',
              error: 'Something failed',
            })
          }
        >
          Promise
        </Button>
      </div>
    </div>
  );
}
