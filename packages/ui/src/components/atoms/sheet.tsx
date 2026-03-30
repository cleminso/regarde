'use client'

import {
  Sheet as ShadSheet,
  SheetTrigger as ShadSheetTrigger,
  SheetClose as ShadSheetClose,
  SheetContent as ShadSheetContent,
  SheetHeader as ShadSheetHeader,
  SheetFooter as ShadSheetFooter,
  SheetTitle as ShadSheetTitle,
  SheetDescription as ShadSheetDescription,
} from "@/components/shadcn-ui/sheet"
import { cn } from "@/lib/utils"
import React from "react"

/**
 * @example
 * ```tsx
 * // Modal sheet (default)
 * <Sheet>
 *   <SheetTrigger>Open</SheetTrigger>
 *   <SheetContent>
 *     <SheetHeader>
 *       <SheetTitle>Title</SheetTitle>
 *       <SheetDescription>Description</SheetDescription>
 *     </SheetHeader>
 *   </SheetContent>
 * </Sheet>
 * 
 * // Inline sheet (no overlay, for side panels)
 * <Sheet>
 *   <SheetContent variant="inline" container={containerRef}>
 *     <SheetHeader>
 *       <SheetTitle>Side Panel</SheetTitle>
 *     </SheetHeader>
 *   </SheetContent>
 * </Sheet>
 * ```
 */
const Sheet = ({
  ...props
}: React.ComponentProps<typeof ShadSheet>) => <ShadSheet {...props} />
Sheet.displayName = "Sheet"

const SheetTrigger = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof ShadSheetTrigger>) => (
  <ShadSheetTrigger ref={ref} className={cn(className)} {...props} />
)
SheetTrigger.displayName = "SheetTrigger"

const SheetClose = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof ShadSheetClose>) => (
  <ShadSheetClose ref={ref} className={cn(className)} {...props} />
)
SheetClose.displayName = "SheetClose"

type SheetContentProps = React.ComponentProps<typeof ShadSheetContent> & {
  variant?: "modal" | "inline"
  container?: HTMLElement | React.RefObject<HTMLElement | null> | null
}

const SheetContent = ({
  ref,
  className,
  variant = "modal",
  container,
  ...props
}: SheetContentProps) => (
  <ShadSheetContent
    ref={ref}
    className={cn(
      variant === "inline" && "relative h-full w-[400px]",
      className
    )}
    {...(variant === "inline" ? { container } : {})}
    {...props}
  />
)
SheetContent.displayName = "SheetContent"

const SheetHeader = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof ShadSheetHeader>) => (
  <ShadSheetHeader ref={ref} className={cn(className)} {...props} />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof ShadSheetFooter>) => (
  <ShadSheetFooter ref={ref} className={cn(className)} {...props} />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof ShadSheetTitle>) => (
  <ShadSheetTitle ref={ref} className={cn(className)} {...props} />
)
SheetTitle.displayName = "SheetTitle"

const SheetDescription = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof ShadSheetDescription>) => (
  <ShadSheetDescription ref={ref} className={cn(className)} {...props} />
)
SheetDescription.displayName = "SheetDescription"

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
