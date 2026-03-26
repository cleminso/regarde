import {
  Breadcrumb as BaseBreadcrumb,
  BreadcrumbList as BaseBreadcrumbList,
  BreadcrumbItem as BaseBreadcrumbItem,
  BreadcrumbLink as BaseBreadcrumbLink,
  BreadcrumbPage as BaseBreadcrumbPage,
  BreadcrumbSeparator as BaseBreadcrumbSeparator,
  BreadcrumbEllipsis as BaseBreadcrumbEllipsis,
} from "@/components/shadcn-ui/breadcrumb"
import { twMerge } from "tailwind-merge"
import React from "react"

/**
 * Branded breadcrumb navigation with Regarde styling.
 * Used for showing the current page location within a hierarchy.
 *
 * @example
 * ```tsx
 * <Breadcrumb.Root>
 *   <Breadcrumb.List>
 *     <Breadcrumb.Item>
 *       <Breadcrumb.Link href="/">Home</Breadcrumb.Link>
 *     </Breadcrumb.Item>
 *     <Breadcrumb.Separator />
 *     <Breadcrumb.Item>
 *       <Breadcrumb.Page>Current Page</Breadcrumb.Page>
 *     </Breadcrumb.Item>
 *   </Breadcrumb.List>
 * </Breadcrumb.Root>
 * ```
 */

// Re-export with Regarde branding - currently thin wrappers
// Add customizations here as needed (e.g., size variants, custom separators)

const BreadcrumbRoot = ({
  className,
  ...props
}: React.ComponentProps<typeof BaseBreadcrumb>) => {
  return <BaseBreadcrumb className={twMerge("", className)} {...props} />
}
BreadcrumbRoot.displayName = "Breadcrumb"

const BreadcrumbList = ({
  className,
  ...props
}: React.ComponentProps<typeof BaseBreadcrumbList>) => {
  return <BaseBreadcrumbList className={twMerge("", className)} {...props} />
}
BreadcrumbList.displayName = "BreadcrumbList"

const BreadcrumbItem = ({
  className,
  ...props
}: React.ComponentProps<typeof BaseBreadcrumbItem>) => {
  return <BaseBreadcrumbItem className={twMerge("", className)} {...props} />
}
BreadcrumbItem.displayName = "BreadcrumbItem"

const BreadcrumbLink = ({
  className,
  ...props
}: React.ComponentProps<typeof BaseBreadcrumbLink>) => {
  return <BaseBreadcrumbLink className={twMerge("", className)} {...props} />
}
BreadcrumbLink.displayName = "BreadcrumbLink"

const BreadcrumbPage = ({
  className,
  ...props
}: React.ComponentProps<typeof BaseBreadcrumbPage>) => {
  return <BaseBreadcrumbPage className={twMerge("", className)} {...props} />
}
BreadcrumbPage.displayName = "BreadcrumbPage"

const BreadcrumbSeparator = ({
  className,
  ...props
}: React.ComponentProps<typeof BaseBreadcrumbSeparator>) => {
  return (
    <BaseBreadcrumbSeparator className={twMerge("", className)} {...props} />
  )
}
BreadcrumbSeparator.displayName = "BreadcrumbSeparator"

const BreadcrumbEllipsis = ({
  className,
  ...props
}: React.ComponentProps<typeof BaseBreadcrumbEllipsis>) => {
  return (
    <BaseBreadcrumbEllipsis className={twMerge("", className)} {...props} />
  )
}
BreadcrumbEllipsis.displayName = "BreadcrumbEllipsis"

/**
 * Compound component export for destructured access:
 * <Breadcrumb.Root><Breadcrumb.List>...</Breadcrumb.List></Breadcrumb.Root>
 */
const Breadcrumb = {
  Root: BreadcrumbRoot,
  List: BreadcrumbList,
  Item: BreadcrumbItem,
  Link: BreadcrumbLink,
  Page: BreadcrumbPage,
  Separator: BreadcrumbSeparator,
  Ellipsis: BreadcrumbEllipsis,
}

export default BreadcrumbRoot

export {
  Breadcrumb,
  BreadcrumbRoot, // Default export
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}

export type BreadcrumbProps = React.ComponentProps<typeof BaseBreadcrumb>
export type BreadcrumbListProps = React.ComponentProps<typeof BaseBreadcrumbList>
export type BreadcrumbItemProps = React.ComponentProps<typeof BaseBreadcrumbItem>
export type BreadcrumbLinkProps = React.ComponentProps<typeof BaseBreadcrumbLink>
export type BreadcrumbPageProps = React.ComponentProps<typeof BaseBreadcrumbPage>
export type BreadcrumbSeparatorProps = React.ComponentProps<typeof BaseBreadcrumbSeparator>
export type BreadcrumbEllipsisProps = React.ComponentProps<typeof BaseBreadcrumbEllipsis>
