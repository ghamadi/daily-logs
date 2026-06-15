'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { PanelLeftIcon } from 'lucide-react';
import { Slot } from 'radix-ui';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ComponentProps, CSSProperties } from 'react';
import { cn, composeCompoundComponent } from '@/lib/utils/components';
import { useIsMobile } from '@/hooks/use-media-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Sheet } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, type TooltipContentProps } from '@/components/ui/tooltip';

const SIDEBAR_COOKIE_NAME = 'sidebar_state';
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = '16rem';
const SIDEBAR_WIDTH_MOBILE = '18rem';
const SIDEBAR_WIDTH_ICON = '3rem';
const SIDEBAR_KEYBOARD_SHORTCUT = 'b';

type SidebarContextType = {
  state: 'expanded' | 'collapsed';
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextType | null>(null);

export const Sidebar = composeCompoundComponent(SidebarRoot, {
  Trigger: SidebarTrigger,
  Rail: SidebarRail,
  Inset: SidebarInset,
  Input: SidebarInput,
  Header: SidebarHeader,
  Footer: SidebarFooter,
  Separator: SidebarSeparator,
  Content: SidebarContent,
  Group: SidebarGroup,
  GroupLabel: SidebarGroupLabel,
  GroupAction: SidebarGroupAction,
  GroupContent: SidebarGroupContent,
  Menu: SidebarMenu,
  MenuItem: SidebarMenuItem,
  MenuButton: SidebarMenuButton,
  MenuAction: SidebarMenuAction,
  MenuBadge: SidebarMenuBadge,
  MenuSkeleton: SidebarMenuSkeleton,
  MenuSub: SidebarMenuSub,
  MenuSubItem: SidebarMenuSubItem,
  MenuSubButton: SidebarMenuSubButton,
});

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.');
  }
  return context;
}

export type SidebarProviderProps = ComponentProps<'div'> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function SidebarProvider(props: SidebarProviderProps) {
  const {
    defaultOpen = true,
    open: openProp,
    onOpenChange: setOpenProp,
    className,
    style,
    children,
    ...rest
  } = props;

  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = useState(false);
  const [_open, _setOpen] = useState(defaultOpen);
  const open = openProp ?? _open;

  const setOpen = useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === 'function' ? value(open) : value;
      if (setOpenProp) {
        setOpenProp(openState);
      } else {
        _setOpen(openState);
      }
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    },
    [setOpenProp, open],
  );

  const toggleSidebar = useCallback(() => {
    return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open);
  }, [isMobile, setOpen, setOpenMobile]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  const state = open ? 'expanded' : 'collapsed';

  const contextValue = useMemo<SidebarContextType>(
    () => ({ state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar],
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        data-slot="sidebar-wrapper"
        style={
          {
            '--sidebar-width': SIDEBAR_WIDTH,
            '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
            ...style,
          } as CSSProperties
        }
        className={cn(
          'group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-sidebar',
          className,
        )}
        {...rest}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

// ------------------------------------------------------------
// SidebarRoot
// ------------------------------------------------------------

export type SidebarProps = ComponentProps<'div'> & {
  side?: 'left' | 'right';
  variant?: 'sidebar' | 'floating' | 'inset';
  collapsible?: 'offcanvas' | 'icon' | 'none';
};

function SidebarRoot(props: SidebarProps) {
  const { side = 'left', variant = 'sidebar', collapsible = 'offcanvas', className, children, dir, ...rest } = props;
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

  if (collapsible === 'none') {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          'flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground',
          className,
        )}
        {...rest}
      >
        {children}
      </div>
    );
  }

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <Sheet.Content
          dir={dir}
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          showCloseButton={false}
          className="w-(--sidebar-width) bg-sidebar p-0 text-sidebar-foreground"
          style={{ '--sidebar-width': SIDEBAR_WIDTH_MOBILE } as CSSProperties}
          side={side}
        >
          <Sheet.Header className="sr-only">
            <Sheet.Title>Sidebar</Sheet.Title>
            <Sheet.Description>Displays the mobile sidebar.</Sheet.Description>
          </Sheet.Header>
          <div className="flex h-full w-full flex-col">{children}</div>
        </Sheet.Content>
      </Sheet>
    );
  }

  return (
    <div
      className="group peer hidden text-sidebar-foreground md:block"
      data-state={state}
      data-collapsible={state === 'collapsed' ? collapsible : ''}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      <div
        data-slot="sidebar-gap"
        className={cn(
          'relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear',
          'group-data-[collapsible=offcanvas]:w-0',
          'group-data-[side=right]:rotate-180',
          variant === 'floating' || variant === 'inset'
            ? 'group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]'
            : 'group-data-[collapsible=icon]:w-(--sidebar-width-icon)',
        )}
      />
      <div
        data-slot="sidebar-container"
        data-side={side}
        className={cn(
          'fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear data-[side=left]:left-0 data-[side=left]:group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)] data-[side=right]:right-0 data-[side=right]:group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)] md:flex',
          variant === 'floating' || variant === 'inset'
            ? 'p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]'
            : 'group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l',
          className,
        )}
        {...rest}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className="flex size-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:shadow-sm group-data-[variant=floating]:ring-1 group-data-[variant=floating]:ring-sidebar-border"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// SidebarTrigger
// ------------------------------------------------------------

export type SidebarTriggerProps = ComponentProps<typeof Button>;

function SidebarTrigger(props: SidebarTriggerProps) {
  const { className, onClick, ...rest } = props;
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon-sm"
      className={cn(className)}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...rest}
    >
      <PanelLeftIcon className="cn-rtl-flip" />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}

// ------------------------------------------------------------
// SidebarRail
// ------------------------------------------------------------

export type SidebarRailProps = ComponentProps<'button'>;

function SidebarRail(props: SidebarRailProps) {
  const { className, ...rest } = props;
  const { toggleSidebar } = useSidebar();

  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        'absolute inset-y-0 z-20 hidden w-4 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:start-1/2 after:w-[2px] hover:after:bg-sidebar-border sm:flex ltr:-translate-x-1/2 rtl:-translate-x-1/2',
        'in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize',
        '[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize',
        'group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full hover:group-data-[collapsible=offcanvas]:bg-sidebar',
        '[[data-side=left][data-collapsible=offcanvas]_&]:-right-2',
        '[[data-side=right][data-collapsible=offcanvas]_&]:-left-2',
        className,
      )}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// SidebarInset
// ------------------------------------------------------------

export type SidebarInsetProps = ComponentProps<'main'>;

function SidebarInset(props: SidebarInsetProps) {
  const { className, ...rest } = props;
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        'relative flex w-full flex-1 flex-col bg-background md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2',
        className,
      )}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// SidebarInput
// ------------------------------------------------------------

export type SidebarInputProps = ComponentProps<typeof Input>;

function SidebarInput(props: SidebarInputProps) {
  const { className, ...rest } = props;
  return (
    <Input
      data-slot="sidebar-input"
      data-sidebar="input"
      className={cn('h-8 w-full bg-background shadow-none', className)}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// SidebarHeader
// ------------------------------------------------------------

export type SidebarHeaderProps = ComponentProps<'div'>;

function SidebarHeader(props: SidebarHeaderProps) {
  const { className, ...rest } = props;
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn('flex flex-col gap-2 p-2', className)}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// SidebarFooter
// ------------------------------------------------------------

export type SidebarFooterProps = ComponentProps<'div'>;

function SidebarFooter(props: SidebarFooterProps) {
  const { className, ...rest } = props;
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn('flex flex-col gap-2 p-2', className)}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// SidebarSeparator
// ------------------------------------------------------------

export type SidebarSeparatorProps = ComponentProps<typeof Separator>;

function SidebarSeparator(props: SidebarSeparatorProps) {
  const { className, ...rest } = props;
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn('mx-2 w-auto bg-sidebar-border', className)}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// SidebarContent
// ------------------------------------------------------------

export type SidebarContentProps = ComponentProps<'div'>;

function SidebarContent(props: SidebarContentProps) {
  const { className, ...rest } = props;
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn(
        'no-scrollbar flex min-h-0 flex-1 flex-col gap-0 overflow-auto group-data-[collapsible=icon]:overflow-hidden',
        className,
      )}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// SidebarGroup
// ------------------------------------------------------------

export type SidebarGroupProps = ComponentProps<'div'>;

function SidebarGroup(props: SidebarGroupProps) {
  const { className, ...rest } = props;
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn('relative flex w-full min-w-0 flex-col p-2', className)}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// SidebarGroupLabel
// ------------------------------------------------------------

export type SidebarGroupLabelProps = ComponentProps<'div'> & { asChild?: boolean };

function SidebarGroupLabel(props: SidebarGroupLabelProps) {
  const { className, asChild = false, ...rest } = props;
  const Comp = asChild ? Slot.Root : 'div';

  return (
    <Comp
      data-slot="sidebar-group-label"
      data-sidebar="group-label"
      className={cn(
        'flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 ring-sidebar-ring outline-hidden transition-[margin,opacity] duration-200 ease-linear group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
        className,
      )}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// SidebarGroupAction
// ------------------------------------------------------------

export type SidebarGroupActionProps = ComponentProps<'button'> & { asChild?: boolean };

function SidebarGroupAction(props: SidebarGroupActionProps) {
  const { className, asChild = false, ...rest } = props;
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="sidebar-group-action"
      data-sidebar="group-action"
      className={cn(
        'absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform group-data-[collapsible=icon]:hidden after:absolute after:-inset-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 md:after:hidden [&>svg]:size-4 [&>svg]:shrink-0',
        className,
      )}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// SidebarGroupContent
// ------------------------------------------------------------

export type SidebarGroupContentProps = ComponentProps<'div'>;

function SidebarGroupContent(props: SidebarGroupContentProps) {
  const { className, ...rest } = props;
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn('w-full text-sm', className)}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// SidebarMenu
// ------------------------------------------------------------

export type SidebarMenuProps = ComponentProps<'ul'>;

function SidebarMenu(props: SidebarMenuProps) {
  const { className, ...rest } = props;
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn('flex w-full min-w-0 flex-col gap-0', className)}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// SidebarMenuItem
// ------------------------------------------------------------

export type SidebarMenuItemProps = ComponentProps<'li'>;

function SidebarMenuItem(props: SidebarMenuItemProps) {
  const { className, ...rest } = props;
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn('group/menu-item relative', className)}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// SidebarMenuButton
// ------------------------------------------------------------

const sidebarMenuButtonVariants = cva(
  'peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-open:hover:bg-sidebar-accent data-open:hover:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:font-medium data-active:text-sidebar-accent-foreground [&_svg]:size-4 [&_svg]:shrink-0 [&>span:last-child]:truncate',
  {
    variants: {
      variant: {
        default: 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        outline:
          'bg-background shadow-[0_0_0_1px_var(--sidebar-border)] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_var(--sidebar-accent)]',
      },
      size: {
        default: 'h-8 text-sm',
        sm: 'h-7 text-xs',
        lg: 'h-12 text-sm group-data-[collapsible=icon]:p-0!',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export type SidebarMenuButtonProps = ComponentProps<'button'> & {
  asChild?: boolean;
  isActive?: boolean;
  tooltip?: string | TooltipContentProps;
} & VariantProps<typeof sidebarMenuButtonVariants>;

function SidebarMenuButton(props: SidebarMenuButtonProps) {
  const {
    asChild = false,
    isActive = false,
    variant = 'default',
    size = 'default',
    tooltip: tooltipProp,
    className,
    ...rest
  } = props;

  const Comp = asChild ? Slot.Root : 'button';
  const { isMobile, state } = useSidebar();

  const tooltip = typeof tooltipProp === 'string' ? { children: tooltipProp } : tooltipProp;

  const button = (
    <Comp
      data-slot="sidebar-menu-button"
      data-sidebar="menu-button"
      data-size={size}
      data-active={isActive}
      className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
      {...rest}
    />
  );

  if (!tooltip) return button;

  return (
    <Tooltip>
      <Tooltip.Trigger asChild>{button}</Tooltip.Trigger>
      <Tooltip.Content
        side="right"
        align="center"
        hidden={state !== 'collapsed' || isMobile}
        {...tooltip}
      />
    </Tooltip>
  );
}

// ------------------------------------------------------------
// SidebarMenuAction
// ------------------------------------------------------------

export type SidebarMenuActionProps = ComponentProps<'button'> & {
  asChild?: boolean;
  showOnHover?: boolean;
};

function SidebarMenuAction(props: SidebarMenuActionProps) {
  const { className, asChild = false, showOnHover = false, ...rest } = props;
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="sidebar-menu-action"
      data-sidebar="menu-action"
      className={cn(
        'absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform group-data-[collapsible=icon]:hidden peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 peer-data-[size=sm]/menu-button:top-1 after:absolute after:-inset-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 md:after:hidden [&>svg]:size-4 [&>svg]:shrink-0',
        showOnHover &&
          'group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 peer-data-active/menu-button:text-sidebar-accent-foreground aria-expanded:opacity-100 md:opacity-0',
        className,
      )}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// SidebarMenuBadge
// ------------------------------------------------------------

export type SidebarMenuBadgeProps = ComponentProps<'div'>;

function SidebarMenuBadge(props: SidebarMenuBadgeProps) {
  const { className, ...rest } = props;
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn(
        'pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium text-sidebar-foreground tabular-nums select-none group-data-[collapsible=icon]:hidden peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 peer-data-[size=sm]/menu-button:top-1 peer-data-active/menu-button:text-sidebar-accent-foreground',
        className,
      )}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// SidebarMenuSkeleton
// ------------------------------------------------------------

export type SidebarMenuSkeletonProps = ComponentProps<'div'> & {
  showIcon?: boolean;
};

function SidebarMenuSkeleton(props: SidebarMenuSkeletonProps) {
  const { className, showIcon = false, ...rest } = props;
  const [width] = useState(() => `${Math.floor(Math.random() * 40) + 50}%`);

  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={cn('flex h-8 items-center gap-2 rounded-md px-2', className)}
      {...rest}
    >
      {showIcon && (
        <Skeleton className="size-4 rounded-md" data-sidebar="menu-skeleton-icon" />
      )}
      <Skeleton
        className="h-4 max-w-(--skeleton-width) flex-1"
        data-sidebar="menu-skeleton-text"
        style={{ '--skeleton-width': width } as CSSProperties}
      />
    </div>
  );
}

// ------------------------------------------------------------
// SidebarMenuSub
// ------------------------------------------------------------

export type SidebarMenuSubProps = ComponentProps<'ul'>;

function SidebarMenuSub(props: SidebarMenuSubProps) {
  const { className, ...rest } = props;
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn(
        'mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5 group-data-[collapsible=icon]:hidden',
        className,
      )}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// SidebarMenuSubItem
// ------------------------------------------------------------

export type SidebarMenuSubItemProps = ComponentProps<'li'>;

function SidebarMenuSubItem(props: SidebarMenuSubItemProps) {
  const { className, ...rest } = props;
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn('group/menu-sub-item relative', className)}
      {...rest}
    />
  );
}

// ------------------------------------------------------------
// SidebarMenuSubButton
// ------------------------------------------------------------

export type SidebarMenuSubButtonProps = ComponentProps<'a'> & {
  asChild?: boolean;
  size?: 'sm' | 'md';
  isActive?: boolean;
};

function SidebarMenuSubButton(props: SidebarMenuSubButtonProps) {
  const { asChild = false, size = 'md', isActive = false, className, ...rest } = props;
  const Comp = asChild ? Slot.Root : 'a';

  return (
    <Comp
      data-slot="sidebar-menu-sub-button"
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        'flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground ring-sidebar-ring outline-hidden group-data-[collapsible=icon]:hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[size=md]:text-sm data-[size=sm]:text-xs data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground',
        className,
      )}
      {...rest}
    />
  );
}
