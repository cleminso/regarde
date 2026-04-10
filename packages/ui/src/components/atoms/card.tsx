import {
  Card as ShadCard,
  CardHeader as ShadCardHeader,
  CardTitle as ShadCardTitle,
  CardDescription as ShadCardDescription,
  CardContent as ShadCardContent,
  CardFooter as ShadCardFooter,
  CardAction as ShadCardAction,
} from "@/components/shadcn-ui/card"
import { twMerge } from "tailwind-merge"
import React from "react"

/**
 * @example
 * ```tsx
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Card Title</CardTitle>
 *     <CardDescription>Card description text</CardDescription>
 *   </CardHeader>
 *   <CardContent>
 *     Content goes here
 *   </CardContent>
 *   <CardFooter>
 *     <Button>Action</Button>
 *   </CardFooter>
 * </Card>
 * ```
 */
const Card = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof ShadCard>) => (
  <ShadCard
    ref={ref}
    data-slot="card"
    className={twMerge(
      "group/card flex flex-col gap-4 overflow-hidden rounded-sm bg-card py-3 text-xs/relaxed text-card-foreground ring-1 ring-foreground/10 has-[>img:first-child]:pt-0",
      className
    )}
    {...props}
  />
)
Card.displayName = "Card"

const CardHeader = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof ShadCardHeader>) => (
  <ShadCardHeader
    ref={ref}
    data-slot="card-header"
    className={twMerge(
      "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-lg px-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-4",
      className
    )}
    {...props}
  />
)
CardHeader.displayName = "CardHeader"

const CardTitle = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof ShadCardTitle>) => (
  <ShadCardTitle
    ref={ref}
    data-slot="card-title"
    className={twMerge(
      "text-sm font-medium",
      className
    )}
    {...props}
  />
)
CardTitle.displayName = "CardTitle"

const CardDescription = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof ShadCardDescription>) => (
  <ShadCardDescription
    ref={ref}
    data-slot="card-description"
    className={twMerge(
      "text-sm/relaxed text-muted-foreground",
      className
    )}
    {...props}
  />
)
CardDescription.displayName = "CardDescription"

const CardContent = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof ShadCardContent>) => (
  <ShadCardContent
    ref={ref}
    data-slot="card-content"
    className={twMerge("px-4", className)}
    {...props}
  />
)
CardContent.displayName = "CardContent"

const CardFooter = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof ShadCardFooter>) => (
  <ShadCardFooter
    ref={ref}
    data-slot="card-footer"
    className={twMerge(
      "flex items-center rounded-b-lg px-4 [.border-t]:pt-4",
      className
    )}
    {...props}
  />
)
CardFooter.displayName = "CardFooter"

const CardAction = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof ShadCardAction>) => (
  <ShadCardAction
    ref={ref}
    data-slot="card-action"
    className={twMerge(
      "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
      className
    )}
    {...props}
  />
)
CardAction.displayName = "CardAction"

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
}
