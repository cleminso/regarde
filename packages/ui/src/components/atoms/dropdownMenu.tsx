'use client'

import {
  DropdownMenu as ShadDropdownMenu,
  DropdownMenuPortal as ShadDropdownMenuPortal,
  DropdownMenuTrigger as ShadDropdownMenuTrigger,
  DropdownMenuContent as ShadDropdownMenuContent,
  DropdownMenuGroup as ShadDropdownMenuGroup,
  DropdownMenuLabel as ShadDropdownMenuLabel,
  DropdownMenuItem as ShadDropdownMenuItem,
  DropdownMenuSub as ShadDropdownMenuSub,
  DropdownMenuSubTrigger as ShadDropdownMenuSubTrigger,
  DropdownMenuSubContent as ShadDropdownMenuSubContent,
  DropdownMenuCheckboxItem as ShadDropdownMenuCheckboxItem,
  DropdownMenuRadioGroup as ShadDropdownMenuRadioGroup,
  DropdownMenuRadioItem as ShadDropdownMenuRadioItem,
  DropdownMenuSeparator as ShadDropdownMenuSeparator,
  DropdownMenuShortcut as ShadDropdownMenuShortcut,
} from "@/components/shadcn-ui/dropdown-menu"
import { cn } from "@/lib/utils"
import React from "react"

/**
 * @example
 * ```tsx
 * <DropdownMenu>
 *   <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
 *   <DropdownMenuContent>
 *     <DropdownMenuItem onClick={handleAction}>Action</DropdownMenuItem>
 *     <DropdownMenuSeparator />
 *     <DropdownMenuItem>Delete</DropdownMenuItem>
 *   </DropdownMenuContent>
 * </DropdownMenu>
 * ```
 */
const DropdownMenu = ({
  ...props
}: React.ComponentProps<typeof ShadDropdownMenu>) => (
  <ShadDropdownMenu {...props} />
)
DropdownMenu.displayName = "DropdownMenu"

const DropdownMenuPortal = ({
  ...props
}: React.ComponentProps<typeof ShadDropdownMenuPortal>) => (
  <ShadDropdownMenuPortal {...props} />
)
DropdownMenuPortal.displayName = "DropdownMenuPortal"

const DropdownMenuTrigger = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof ShadDropdownMenuTrigger>) => (
  <ShadDropdownMenuTrigger
    ref={ref}
    className={cn("outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}
    {...props}
  />
)
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

const DropdownMenuContent = ({
  ref,
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof ShadDropdownMenuContent>) => (
  <DropdownMenuPortal>
    <ShadDropdownMenuContent
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 max-h-[var(--available-height)] w-[var(--anchor-width)] min-w-32 origin-[var(--transform-origin)] overflow-x-hidden overflow-y-auto rounded-sm bg-popover p-1 text-xs text-popover-foreground shadow-lg ring-1 ring-foreground/10 duration-100 outline-none data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:overflow-hidden data-closed:fade-out-0 data-closed:zoom-out-95",
        className
      )}
      {...props}
    />
  </DropdownMenuPortal>
)
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuGroup = ({
  ...props
}: React.ComponentProps<typeof ShadDropdownMenuGroup>) => (
  <ShadDropdownMenuGroup {...props} />
)
DropdownMenuGroup.displayName = "DropdownMenuGroup"

const DropdownMenuLabel = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof ShadDropdownMenuLabel>) => (
  <ShadDropdownMenuLabel
    ref={ref}
    className={cn(
      "px-1.5 py-1 text-sm font-medium text-muted-foreground",
      className
    )}
    {...props}
  />
)
DropdownMenuLabel.displayName = "DropdownMenuLabel"

const DropdownMenuItem = ({
  ref,
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof ShadDropdownMenuItem>) => (
  <ShadDropdownMenuItem
    ref={ref}
    onClick={onClick}
    className={cn(
      "group/dropdown-menu-item relative flex cursor-default items-center gap-1.5 rounded-xs px-1.5 py-1 text-xs outline-none select-none focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
      onClick && "cursor-pointer",
      className
    )}
    {...props}
  />
)
DropdownMenuItem.displayName = "DropdownMenuItem"

const DropdownMenuSub = ({
  ...props
}: React.ComponentProps<typeof ShadDropdownMenuSub>) => (
  <ShadDropdownMenuSub {...props} />
)
DropdownMenuSub.displayName = "DropdownMenuSub"

const DropdownMenuSubTrigger = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof ShadDropdownMenuSubTrigger>) => (
  <ShadDropdownMenuSubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default items-center gap-1.5 rounded-xs px-1.5 py-1 text-xs outline-none select-none focus:bg-accent focus:text-accent-foreground data-popup-open:bg-accent data-popup-open:text-accent-foreground data-open:bg-accent data-open:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
      className
    )}
    {...props}
  />
)
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger"

const DropdownMenuSubContent = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof ShadDropdownMenuSubContent>) => (
  <ShadDropdownMenuSubContent
    ref={ref}
    className={cn(
      "z-50 max-h-[var(--available-height)] w-auto min-w-[96px] origin-[var(--transform-origin)] overflow-x-hidden overflow-y-auto rounded-sm bg-popover p-1 text-xs text-popover-foreground shadow-lg ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:overflow-hidden data-closed:fade-out-0 data-closed:zoom-out-95",
      className
    )}
    {...props}
  />
)
DropdownMenuSubContent.displayName = "DropdownMenuSubContent"

const DropdownMenuCheckboxItem = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof ShadDropdownMenuCheckboxItem>) => (
  <ShadDropdownMenuCheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default items-center gap-1.5 rounded-xs py-1 pr-8 pl-1.5 text-xs outline-none select-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
      className
    )}
    {...props}
  />
)
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem"

const DropdownMenuRadioGroup = ({
  ...props
}: React.ComponentProps<typeof ShadDropdownMenuRadioGroup>) => (
  <ShadDropdownMenuRadioGroup {...props} />
)
DropdownMenuRadioGroup.displayName = "DropdownMenuRadioGroup"

const DropdownMenuRadioItem = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof ShadDropdownMenuRadioItem>) => (
  <ShadDropdownMenuRadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-xs outline-none select-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
      className
    )}
    {...props}
  />
)
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem"

const DropdownMenuSeparator = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof ShadDropdownMenuSeparator>) => (
  <ShadDropdownMenuSeparator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-border", className)}
    {...props}
  />
)
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"

const DropdownMenuShortcut = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof ShadDropdownMenuShortcut>) => (
  <ShadDropdownMenuShortcut
    ref={ref}
    className={cn(
      "ml-auto text-sm tracking-widest text-muted-foreground group-focus/dropdown-menu-item:text-accent-foreground",
      className
    )}
    {...props}
  />
)
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
}
