'use client'

import {
  Tabs as ShadTabs,
  TabsList as ShadTabsList,
  TabsTrigger as ShadTabsTrigger,
  TabsContent as ShadTabsContent,
} from "@/components/shadcn-ui/tabs"
import { cn } from "@/lib/utils"
import React from "react"

/**
 * @example
 * ```tsx
 * <Tabs defaultValue="account">
 *   <TabsList>
 *     <TabsTrigger value="account">Account</TabsTrigger>
 *     <TabsTrigger value="password">Password</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="account">Account settings</TabsContent>
 *   <TabsContent value="password">Password settings</TabsContent>
 * </Tabs>
 * ```
 */
const Tabs = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof ShadTabs>) => (
  <ShadTabs
    ref={ref}
    data-slot="tabs"
    className={cn("group/tabs flex gap-2 data-horizontal:flex-col", className)}
    {...props}
  />
)
Tabs.displayName = "Tabs"

const TabsList = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof ShadTabsList>) => (
  <ShadTabsList
    ref={ref}
    data-slot="tabs-list"
    className={cn(
      "group/tabs-list inline-flex w-fit items-center justify-center rounded-sm p-[3px] text-muted-foreground group-data-horizontal/tabs:h-8 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none",
      className
    )}
    {...props}
  />
)
TabsList.displayName = "TabsList"

const TabsTrigger = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof ShadTabsTrigger>) => (
  <ShadTabsTrigger
    ref={ref}
    data-slot="tabs-trigger"
    className={cn(
      "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-xs border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 dark:text-muted-foreground dark:hover:text-foreground group-data-[variant=default]/tabs-list:data-active:shadow-sm group-data-[variant=line]/tabs-list:data-active:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
      "group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent",
      "data-active:bg-background data-active:text-foreground dark:data-active:border-input dark:data-active:bg-input/30 dark:data-active:text-foreground",
      "after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-[-5px] group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-1 group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
      className
    )}
    {...props}
  />
)
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof ShadTabsContent>) => (
  <ShadTabsContent
    ref={ref}
    data-slot="tabs-content"
    className={cn("flex-1 text-sm outline-none", className)}
    {...props}
  />
)
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }
