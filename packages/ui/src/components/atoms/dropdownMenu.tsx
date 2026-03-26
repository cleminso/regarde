import {
  DropdownMenu as BaseDropdownMenu,
  DropdownMenuPortal as BaseDropdownMenuPortal,
  DropdownMenuTrigger as BaseDropdownMenuTrigger,
  DropdownMenuContent as BaseDropdownMenuContent,
  DropdownMenuGroup as BaseDropdownMenuGroup,
  DropdownMenuLabel as BaseDropdownMenuLabel,
  DropdownMenuItem as BaseDropdownMenuItem,
  DropdownMenuSub as BaseDropdownMenuSub,
  DropdownMenuSubTrigger as BaseDropdownMenuSubTrigger,
  DropdownMenuSubContent as BaseDropdownMenuSubContent,
  DropdownMenuCheckboxItem as BaseDropdownMenuCheckboxItem,
  DropdownMenuRadioGroup as BaseDropdownMenuRadioGroup,
  DropdownMenuRadioItem as BaseDropdownMenuRadioItem,
  DropdownMenuSeparator as BaseDropdownMenuSeparator,
  DropdownMenuShortcut as BaseDropdownMenuShortcut,
} from "@/components/shadcn-ui/dropdown-menu"
import { cva, type VariantProps } from "class-variance-authority"
import { twMerge } from "tailwind-merge"
import React from "react"

/**
 * Branded dropdown menu component with Regarde styling.
 * Displays a menu of actions or options when triggered.
 *
 * @example
 * ```tsx
 * <DropdownMenu.Root>
 *   <DropdownMenu.Trigger>Open Menu</DropdownMenu.Trigger>
 *   <DropdownMenu.Content>
 *     <DropdownMenu.Item onClick={handleAction}>Action</DropdownMenu.Item>
 *     <DropdownMenu.Separator />
 *     <DropdownMenu.Item variant="destructive">Delete</DropdownMenu.Item>
 *   </DropdownMenu.Content>
 * </DropdownMenu.Root>
 * ```
 */

const dropdownMenuContentVariants = cva("", {
  variants: {
    size: {
      default: "",
      sm: "",
    },
  },
  defaultVariants: {
    size: "default",
  },
})

const DropdownMenuRoot = ({
  ...props
}: React.ComponentProps<typeof BaseDropdownMenu>) => {
  return <BaseDropdownMenu {...props} />
}
DropdownMenuRoot.displayName = "DropdownMenu"

const DropdownMenuPortal = ({
  ...props
}: React.ComponentProps<typeof BaseDropdownMenuPortal>) => {
  return <BaseDropdownMenuPortal {...props} />
}
DropdownMenuPortal.displayName = "DropdownMenuPortal"

const DropdownMenuTrigger = ({
  className,
  ...props
}: React.ComponentProps<typeof BaseDropdownMenuTrigger> & {
  className?: string
}) => {
  return (
    <BaseDropdownMenuTrigger
      className={twMerge("outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}
      {...props}
    />
  )
}
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

const DropdownMenuContent = ({
  ref,
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof BaseDropdownMenuContent> &
  VariantProps<typeof dropdownMenuContentVariants> & {
    ref?: React.RefObject<HTMLDivElement>
  }) => {
  // Compute base classes with twMerge (strings only)
  const baseClasses = twMerge(
    // Regarde styling: compact padding, consistent shadows
    "z-50 max-h-[var(--available-height)] w-[var(--anchor-width)] min-w-32 origin-[var(--transform-origin)] overflow-x-hidden overflow-y-auto rounded-lg bg-popover p-1 text-xs text-popover-foreground shadow-lg ring-1 ring-foreground/10 duration-100 outline-none data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:overflow-hidden data-closed:fade-out-0 data-closed:zoom-out-95"
  )

  return (
    <BaseDropdownMenuContent
      ref={ref}
      className={baseClasses}
      {...props}
    />
  )
}
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuGroup = ({
  ...props
}: React.ComponentProps<typeof BaseDropdownMenuGroup>) => {
  return <BaseDropdownMenuGroup {...props} />
}
DropdownMenuGroup.displayName = "DropdownMenuGroup"

const DropdownMenuLabel = ({
  className,
  ...props
}: React.ComponentProps<typeof BaseDropdownMenuLabel> & {
  className?: string
}) => {
  return (
    <BaseDropdownMenuLabel
      className={twMerge(
        "px-1.5 py-1 text-xs font-medium text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}
DropdownMenuLabel.displayName = "DropdownMenuLabel"

const DropdownMenuItem = ({
  className,
  ...props
}: React.ComponentProps<typeof BaseDropdownMenuItem> & {
  className?: string
}) => {
  return (
    <BaseDropdownMenuItem
      className={twMerge(
        "group/dropdown-menu-item relative flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-xs outline-none select-none focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
        className
      )}
      {...props}
    />
  )
}
DropdownMenuItem.displayName = "DropdownMenuItem"

const DropdownMenuSub = ({
  ...props
}: React.ComponentProps<typeof BaseDropdownMenuSub>) => {
  return <BaseDropdownMenuSub {...props} />
}
DropdownMenuSub.displayName = "DropdownMenuSub"

const DropdownMenuSubTrigger = ({
  className,
  ...props
}: React.ComponentProps<typeof BaseDropdownMenuSubTrigger> & {
  className?: string
}) => {
  return (
    <BaseDropdownMenuSubTrigger
      className={twMerge(
        "flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-xs outline-none select-none focus:bg-accent focus:text-accent-foreground data-popup-open:bg-accent data-popup-open:text-accent-foreground data-open:bg-accent data-open:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
        className
      )}
      {...props}
    />
  )
}
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger"

const DropdownMenuSubContent = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof BaseDropdownMenuSubContent> & {
  ref?: React.RefObject<HTMLDivElement>
}) => {
  // Compute base classes with twMerge (strings only)
  const baseClasses = twMerge(
    "z-50 max-h-[var(--available-height)] w-auto min-w-[96px] origin-[var(--transform-origin)] overflow-x-hidden overflow-y-auto rounded-lg bg-popover p-1 text-xs text-popover-foreground shadow-lg ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:overflow-hidden data-closed:fade-out-0 data-closed:zoom-out-95"
  )

  return (
    <BaseDropdownMenuSubContent
      ref={ref}
      className={baseClasses}
      {...props}
    />
  )
}
DropdownMenuSubContent.displayName = "DropdownMenuSubContent"

const DropdownMenuCheckboxItem = ({
  className,
  ...props
}: React.ComponentProps<typeof BaseDropdownMenuCheckboxItem> & {
  className?: string
}) => {
  return (
    <BaseDropdownMenuCheckboxItem
      className={twMerge(
        "relative flex cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-xs outline-none select-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
        className
      )}
      {...props}
    />
  )
}
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem"

const DropdownMenuRadioGroup = ({
  ...props
}: React.ComponentProps<typeof BaseDropdownMenuRadioGroup>) => {
  return <BaseDropdownMenuRadioGroup {...props} />
}
DropdownMenuRadioGroup.displayName = "DropdownMenuRadioGroup"

const DropdownMenuRadioItem = ({
  className,
  ...props
}: React.ComponentProps<typeof BaseDropdownMenuRadioItem> & {
  className?: string
}) => {
  return (
    <BaseDropdownMenuRadioItem
      className={twMerge(
        "relative flex cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-xs outline-none select-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
        className
      )}
      {...props}
    />
  )
}
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem"

const DropdownMenuSeparator = ({
  className,
  ...props
}: React.ComponentProps<typeof BaseDropdownMenuSeparator> & {
  className?: string
}) => {
  return (
    <BaseDropdownMenuSeparator
      className={twMerge("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.ComponentProps<typeof BaseDropdownMenuShortcut> & {
  className?: string
}) => {
  return (
    <BaseDropdownMenuShortcut
      className={twMerge(
        "ml-auto text-xs tracking-widest text-muted-foreground group-focus/dropdown-menu-item:text-accent-foreground",
        className
      )}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

/**
 * Compound component export for destructured access:
 * <DropdownMenu.Root><DropdownMenu.Trigger>...</DropdownMenu.Trigger></DropdownMenu.Root>
 */
const DropdownMenu = {
  Root: DropdownMenuRoot,
  Portal: DropdownMenuPortal,
  Trigger: DropdownMenuTrigger,
  Content: DropdownMenuContent,
  Group: DropdownMenuGroup,
  Label: DropdownMenuLabel,
  Item: DropdownMenuItem,
  Sub: DropdownMenuSub,
  SubTrigger: DropdownMenuSubTrigger,
  SubContent: DropdownMenuSubContent,
  CheckboxItem: DropdownMenuCheckboxItem,
  RadioGroup: DropdownMenuRadioGroup,
  RadioItem: DropdownMenuRadioItem,
  Separator: DropdownMenuSeparator,
  Shortcut: DropdownMenuShortcut,
}

// Default export is the Root component
export default DropdownMenuRoot

// Named exports for individual components
export {
  DropdownMenu,
  DropdownMenuRoot,
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
  dropdownMenuContentVariants,
}

// Export props types
export type DropdownMenuProps = React.ComponentProps<typeof BaseDropdownMenu>
export type DropdownMenuTriggerProps = React.ComponentProps<typeof BaseDropdownMenuTrigger>
export type DropdownMenuContentProps = React.ComponentProps<typeof BaseDropdownMenuContent> &
  VariantProps<typeof dropdownMenuContentVariants>
export type DropdownMenuItemProps = React.ComponentProps<typeof BaseDropdownMenuItem>
export type DropdownMenuSeparatorProps = React.ComponentProps<typeof BaseDropdownMenuSeparator>
