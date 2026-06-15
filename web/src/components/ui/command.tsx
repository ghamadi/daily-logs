'use client';

import { Command as CommandPrimitive } from 'cmdk';
import { CheckIcon, SearchIcon } from 'lucide-react';
import type { ComponentProps } from 'react';

import { Dialog } from '@/components/ui/dialog';
import { InputGroup, InputGroupAddon } from '@/components/ui/input-group';
import { cn, composeCompoundComponent } from '@/lib/utils/components';

export const Command = composeCompoundComponent(CommandRoot, {
  Dialog: CommandDialog,
  Input: CommandInput,
  List: CommandList,
  Empty: CommandEmpty,
  Group: CommandGroup,
  Item: CommandItem,
  Shortcut: CommandShortcut,
  Separator: CommandSeparator,
});

// ------------------------------------------------------------
// CommandRoot
// ------------------------------------------------------------

export type CommandProps = ComponentProps<typeof CommandPrimitive>;

function CommandRoot(props: CommandProps) {
  const { className, ...rest } = props;
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        'flex size-full flex-col overflow-hidden rounded-xl! bg-popover p-1 text-popover-foreground',
        className,
      )}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// CommandDialog
// ------------------------------------------------------------

export type CommandDialogProps = ComponentProps<typeof Dialog> & {
  title?: string;
  description?: string;
  className?: string;
  showCloseButton?: boolean;
};

function CommandDialog(props: CommandDialogProps) {
  const {
    title = 'Command Palette',
    description = 'Search for a command to run...',
    children,
    className,
    showCloseButton = false,
    ...rest
  } = props;

  return (
    <Dialog {...rest}>
      <Dialog.Header className="sr-only">
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Description>{description}</Dialog.Description>
      </Dialog.Header>
      <Dialog.Content
        className={cn('top-1/3 translate-y-0 overflow-hidden rounded-xl! p-0', className)}
        showCloseButton={showCloseButton}
      >
        {children}
      </Dialog.Content>
    </Dialog>
  );
}

// ------------------------------------------------------------
// CommandInput
// ------------------------------------------------------------

export type CommandInputProps = ComponentProps<typeof CommandPrimitive.Input>;

function CommandInput(props: CommandInputProps) {
  const { className, ...rest } = props;
  return (
    <div data-slot="command-input-wrapper" className="p-1 pb-0">
      <InputGroup className="h-8! rounded-lg! border-input/30 bg-input/30 shadow-none! *:data-[slot=input-group-addon]:pl-2!">
        <CommandPrimitive.Input
          data-slot="command-input"
          className={cn(
            'w-full text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
          {...rest}
        />
        <InputGroupAddon>
          <SearchIcon className="size-4 shrink-0 opacity-50" />
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}

// ------------------------------------------------------------
// CommandList
// ------------------------------------------------------------

export type CommandListProps = ComponentProps<typeof CommandPrimitive.List>;

function CommandList(props: CommandListProps) {
  const { className, ...rest } = props;
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        'no-scrollbar max-h-72 scroll-py-1 overflow-x-hidden overflow-y-auto outline-none',
        className,
      )}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// CommandEmpty
// ------------------------------------------------------------

export type CommandEmptyProps = ComponentProps<typeof CommandPrimitive.Empty>;

function CommandEmpty(props: CommandEmptyProps) {
  const { className, ...rest } = props;
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn('py-6 text-center text-sm', className)}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// CommandGroup
// ------------------------------------------------------------

export type CommandGroupProps = ComponentProps<typeof CommandPrimitive.Group>;

function CommandGroup(props: CommandGroupProps) {
  const { className, ...rest } = props;
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        'overflow-hidden p-1 text-foreground **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground',
        className,
      )}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// CommandItem
// ------------------------------------------------------------

export type CommandItemProps = ComponentProps<typeof CommandPrimitive.Item>;

function CommandItem(props: CommandItemProps) {
  const { className, children, ...rest } = props;
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "group/command-item relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none in-data-[slot=dialog-content]:rounded-lg! data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-selected:bg-muted data-selected:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-selected:*:[svg]:text-foreground",
        className,
      )}
      {...rest}
    >
      {children}
      <CheckIcon className="ml-auto opacity-0 group-has-data-[slot=command-shortcut]/command-item:hidden group-data-[checked=true]/command-item:opacity-100" />
    </CommandPrimitive.Item>
  );
}

// ------------------------------------------------------------
// CommandShortcut
// ------------------------------------------------------------

export type CommandShortcutProps = ComponentProps<'span'>;

function CommandShortcut(props: CommandShortcutProps) {
  const { className, ...rest } = props;
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        'ml-auto text-xs tracking-widest text-muted-foreground group-data-selected/command-item:text-foreground',
        className,
      )}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// CommandSeparator
// ------------------------------------------------------------

export type CommandSeparatorProps = ComponentProps<typeof CommandPrimitive.Separator>;

function CommandSeparator(props: CommandSeparatorProps) {
  const { className, ...rest } = props;
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn('-mx-1 h-px bg-border', className)}
      {...rest}
    />
  );
}
