import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertCircle, Inbox, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const emptyStateVariants = cva(
  "flex flex-col items-center justify-center p-8 text-center",
  {
    variants: {
      variant: {
        empty: "",
        loading: "",
        error: "",
      },
      size: {
        sm: "py-12",
        default: "py-16",
        lg: "py-24",
      },
    },
    defaultVariants: {
      variant: "empty",
      size: "default",
    },
  }
)

const iconVariants = cva("mb-4", {
  variants: {
    variant: {
      empty: "text-muted-foreground",
      loading: "animate-spin text-primary",
      error: "text-destructive",
    },
  },
  defaultVariants: {
    variant: "empty",
  },
})

export interface TDataTableEmptyStateProps
  extends VariantProps<typeof emptyStateVariants>,
    VariantProps<typeof iconVariants> {
  /** Title text - defaults based on variant */
  title?: string
  /** Description text - defaults based on variant */
  description?: string
  /** Custom icon element - defaults based on variant */
  icon?: React.ReactNode
  /** Optional action button or element */
  action?: React.ReactNode
  className?: string
}

/**
 * Empty state component for data tables.
 * Shows messaging for empty, loading, and error states.
 *
 * @example
 * ```tsx
 * // Empty state
 * {data.length === 0 && (
 *   <DataTableEmptyState
 *     title="No webhooks"
 *     description="Get started by creating your first webhook."
 *     action={<Button>Create Webhook</Button>}
 *   />
 * )}
 *
 * // Loading state
 * {isLoading === true && <DataTableEmptyState variant="loading" />}
 *
 * // Error state
 * {error !== null && (
 *   <DataTableEmptyState
 *     variant="error"
 *     title="Failed to load"
 *     description={error.message}
 *     action={<Button onClick={refetch}>Retry</Button>}
 *   />
 * )}
 * ```
 */
function DataTableEmptyState({
  variant = "empty",
  size = "default",
  title,
  description,
  icon,
  action,
  className,
}: TDataTableEmptyStateProps): React.ReactElement {
  const renderIcon = (): React.ReactNode => {
    if (icon !== undefined) return icon

    switch (variant) {
      case "loading":
        return (
          <Loader2
            className={cn("size-8", iconVariants({ variant }))}
            aria-hidden="true"
          />
        )
      case "error":
        return (
          <AlertCircle
            className={cn("size-8", iconVariants({ variant }))}
            aria-hidden="true"
          />
        )
      case "empty":
      default:
        return (
          <Inbox
            className={cn("size-8", iconVariants({ variant }))}
            aria-hidden="true"
          />
        )
    }
  }

  const defaultTitle = ((): string => {
    switch (variant) {
      case "loading":
        return "Loading data..."
      case "error":
        return "Something went wrong"
      case "empty":
      default:
        return "No results found"
    }
  })()

  const defaultDescription = ((): string => {
    switch (variant) {
      case "loading":
        return "Please wait while we fetch your data."
      case "error":
        return "There was an error loading the data. Please try again."
      case "empty":
      default:
        return "No items match your current filters."
    }
  })()

  return (
    <div
      data-slot="data-table-empty-state"
      data-variant={variant}
      className={cn(emptyStateVariants({ variant, size }), className)}
    >
      {renderIcon()}
      <h3 className="text-sm font-medium text-foreground">
        {title ?? defaultTitle}
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        {description ?? defaultDescription}
      </p>
      {action !== undefined && <div className="mt-4">{action}</div>}
    </div>
  )
}

DataTableEmptyState.displayName = "DataTableEmptyState"

export { DataTableEmptyState }
