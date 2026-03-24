import {
  Tabs as BaseTabs,
  TabsList as BaseTabsList,
  TabsTrigger as BaseTabsTrigger,
  TabsContent as BaseTabsContent,
} from "@/components/shadcn-ui/tabs"
import { cva, type VariantProps } from "class-variance-authority"
import { twMerge } from "tailwind-merge"
import React from "react"

/**
 * Branded tabs component with Regarde styling.
 * Organizes content into separate views within the same context.
 *
 * @example
 * ```tsx
 * <Tabs.Root defaultValue="account">
 *   <Tabs.List>
 *     <Tabs.Trigger value="account">Account</Tabs.Trigger>
 *     <Tabs.Trigger value="password">Password</Tabs.Trigger>
 *   </Tabs.List>
 *   <Tabs.Content value="account">Account settings here</Tabs.Content>
 *   <Tabs.Content value="password">Password settings here</Tabs.Content>
 * </Tabs.Root>
 * ```
 */

const tabsListVariants = cva("", {
  variants: {
    variant: {
      default: "",
      line: "",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

const TabsRoot = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof BaseTabs> & {
  ref?: React.RefObject<HTMLDivElement>
}) => {
  // Compute base classes with twMerge (strings only)
  const baseClasses = twMerge(
    "group/tabs flex gap-2 data-[orientation=horizontal]:flex-col"
  )

  return (
    <BaseTabs
      ref={ref}
      className={baseClasses}
      {...props}
    />
  )
}
TabsRoot.displayName = "Tabs"

const TabsList = ({
  ref,
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof BaseTabsList> &
  VariantProps<typeof tabsListVariants> & {
    ref?: React.RefObject<HTMLDivElement>
  }) => {
  // Compute base classes with twMerge (strings only)
  const baseClasses = twMerge(
    // Regarde styling: compact height, consistent with design system
    "group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-xs text-muted-foreground group-data-[orientation=horizontal]/tabs:h-7 group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col data-[variant=line]:rounded-none data-[variant=default]:bg-muted"
  )

  return (
    <BaseTabsList
      ref={ref}
      variant={variant}
      className={baseClasses}
      {...props}
    />
  )
}
TabsList.displayName = "TabsList"

const TabsTrigger = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof BaseTabsTrigger> & {
  ref?: React.RefObject<HTMLButtonElement>
}) => {
  // Compute base classes with twMerge (strings only)
  const baseClasses = twMerge(
    // Regarde styling: smaller text, compact padding
    "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-xs font-medium whitespace-nowrap text-foreground/60 transition-all group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 dark:text-muted-foreground dark:hover:text-foreground group-data-[variant=default]/tabs-list:data-[active]:shadow-sm group-data-[variant=line]/tabs-list:data-[active]:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
    "group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-[active]:bg-transparent dark:group-data-[variant=line]/tabs-list:data-[active]:border-transparent dark:group-data-[variant=line]/tabs-list:data-[active]:bg-transparent",
    "data-[active]:bg-background data-[active]:text-foreground dark:data-[active]:border-input dark:data-[active]:bg-input/30 dark:data-[active]:text-foreground",
    "after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-[orientation=horizontal]/tabs:after:inset-x-0 group-data-[orientation=horizontal]/tabs:after:bottom-[-5px] group-data-[orientation=horizontal]/tabs:after:h-0.5 group-data-[orientation=vertical]/tabs:after:inset-y-0 group-data-[orientation=vertical]/tabs:after:-right-1 group-data-[orientation=vertical]/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-[active]:after:opacity-100"
  )

  return (
    <BaseTabsTrigger
      ref={ref}
      className={baseClasses}
      {...props}
    />
  )
}
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof BaseTabsContent> & {
  ref?: React.RefObject<HTMLDivElement>
}) => {
  // Compute base classes with twMerge (strings only)
  const baseClasses = twMerge(
    // Regarde styling: smaller text
    "flex-1 text-xs outline-none"
  )

  return (
    <BaseTabsContent
      ref={ref}
      className={baseClasses}
      {...props}
    />
  )
}
TabsContent.displayName = "TabsContent"

/**
 * Compound component export for destructured access:
 * <Tabs.Root><Tabs.List>...</Tabs.List></Tabs.Root>
 */
const Tabs = {
  Root: TabsRoot,
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
}

// Default export is the Root component
export default TabsRoot

// Named exports for individual components
export {
  Tabs,
  TabsRoot,
  TabsList,
  TabsTrigger,
  TabsContent,
  tabsListVariants,
}

// Export props types
export type TabsProps = React.ComponentProps<typeof BaseTabs>
export type TabsListProps = React.ComponentProps<typeof BaseTabsList> &
  VariantProps<typeof tabsListVariants>
export type TabsTriggerProps = React.ComponentProps<typeof BaseTabsTrigger>
export type TabsContentProps = React.ComponentProps<typeof BaseTabsContent>
