import {
  Card as BaseCard,
  CardHeader as BaseCardHeader,
  CardTitle as BaseCardTitle,
  CardDescription as BaseCardDescription,
  CardContent as BaseCardContent,
  CardFooter as BaseCardFooter,
  CardAction as BaseCardAction,
} from "@/components/shadcn-ui/card"
import { cva, type VariantProps } from "class-variance-authority"
import { twMerge } from "tailwind-merge"
import React from "react"

/**
 * Branded card component with Regarde styling.
 * Container for grouping related content and actions.
 *
 * @example
 * ```tsx
 * <Card.Root>
 *   <Card.Header>
 *     <Card.Title>Card Title</Card.Title>
 *     <Card.Description>Card description text</Card.Description>
 *   </Card.Header>
 *   <Card.Content>
 *     Content goes here
 *   </Card.Content>
 *   <Card.Footer>
 *     <Button>Action</Button>
 *   </Card.Footer>
 * </Card.Root>
 * ```
 */

const cardVariants = cva("", {
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

const CardRoot = ({
  ref,
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof BaseCard> &
  VariantProps<typeof cardVariants> & {
    ref?: React.RefObject<HTMLDivElement>
  }) => {
  return (
    <BaseCard
      ref={ref}
      data-slot="card"
      data-size={size}
      className={twMerge(
        // Regarde styling: rounded-lg (not xl), compact padding
        "group/card flex flex-col gap-4 overflow-hidden rounded-lg bg-card py-4 text-xs/relaxed text-card-foreground ring-1 ring-foreground/10 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:py-3 *:[img:first-child]:rounded-t-lg *:[img:last-child]:rounded-b-lg",
        className
      )}
      {...props}
    />
  )
}
CardRoot.displayName = "Card"

const CardHeader = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof BaseCardHeader> & {
  ref?: React.RefObject<HTMLDivElement>
}) => {
  return (
    <BaseCardHeader
      ref={ref}
      data-slot="card-header"
      className={twMerge(
        // Regarde styling: rounded-t-lg (not xl), compact padding
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-lg px-4 group-data-[size=sm]/card:px-3 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-4 group-data-[size=sm]/card:[.border-b]:pb-3",
        className
      )}
      {...props}
    />
  )
}
CardHeader.displayName = "CardHeader"

const CardTitle = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof BaseCardTitle> & {
  ref?: React.RefObject<HTMLDivElement>
}) => {
  return (
    <BaseCardTitle
      ref={ref}
      data-slot="card-title"
      className={twMerge(
        // Regarde styling: text-sm (not base), relaxed line height
        "text-sm font-medium group-data-[size=sm]/card:text-xs/relaxed",
        className
      )}
      {...props}
    />
  )
}
CardTitle.displayName = "CardTitle"

const CardDescription = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof BaseCardDescription> & {
  ref?: React.RefObject<HTMLDivElement>
}) => {
  return (
    <BaseCardDescription
      ref={ref}
      data-slot="card-description"
      className={twMerge(
        // Regarde styling: text-xs/relaxed
        "text-xs/relaxed text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}
CardDescription.displayName = "CardDescription"

const CardContent = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof BaseCardContent> & {
  ref?: React.RefObject<HTMLDivElement>
}) => {
  return (
    <BaseCardContent
      ref={ref}
      data-slot="card-content"
      className={twMerge("px-4 group-data-[size=sm]/card:px-3", className)}
      {...props}
    />
  )
}
CardContent.displayName = "CardContent"

const CardFooter = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof BaseCardFooter> & {
  ref?: React.RefObject<HTMLDivElement>
}) => {
  return (
    <BaseCardFooter
      ref={ref}
      data-slot="card-footer"
      className={twMerge(
        // Regarde styling: no border-t, no bg-muted, compact padding
        "flex items-center rounded-b-lg px-4 group-data-[size=sm]/card:px-3 [.border-t]:pt-4 group-data-[size=sm]/card:[.border-t]:pt-3",
        className
      )}
      {...props}
    />
  )
}
CardFooter.displayName = "CardFooter"

const CardAction = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof BaseCardAction> & {
  ref?: React.RefObject<HTMLDivElement>
}) => {
  return (
    <BaseCardAction
      ref={ref}
      data-slot="card-action"
      className={twMerge(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}
CardAction.displayName = "CardAction"

/**
 * Compound component export for destructured access:
 * <Card.Root><Card.Header>...</Card.Header></Card.Root>
 */
const Card = {
  Root: CardRoot,
  Header: CardHeader,
  Title: CardTitle,
  Description: CardDescription,
  Content: CardContent,
  Footer: CardFooter,
  Action: CardAction,
}

// Default export is the Root component
export default CardRoot

// Named exports for individual components
export {
  Card,
  CardRoot,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
  cardVariants,
}

// Export props types
export type CardProps = React.ComponentProps<typeof BaseCard> &
  VariantProps<typeof cardVariants>
export type CardHeaderProps = React.ComponentProps<typeof BaseCardHeader>
export type CardTitleProps = React.ComponentProps<typeof BaseCardTitle>
export type CardDescriptionProps = React.ComponentProps<typeof BaseCardDescription>
export type CardContentProps = React.ComponentProps<typeof BaseCardContent>
export type CardFooterProps = React.ComponentProps<typeof BaseCardFooter>
export type CardActionProps = React.ComponentProps<typeof BaseCardAction>
