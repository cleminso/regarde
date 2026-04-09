import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { formatTimestamp } from "little-timestamp"
import { cn } from "@/lib/utils"

const formattedDateVariants = cva("tabular-nums", {
  variants: {
    variant: {
      default: "text-sm text-foreground",
      muted: "text-sm text-muted-foreground",
      dim: "text-xs text-muted-foreground",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

export type TDateFormat = "relative" | "short" | "long" | "iso"

export interface TFormattedDateProps
  extends VariantProps<typeof formattedDateVariants> {
  /** Jazz Unix timestamp (ms), Date object, or ISO string */
  date: number | Date | string | undefined | null
  /** Format style - relative shows "2h ago", short shows "06/01/2024" */
  format?: TDateFormat
  /** Text to show when date is undefined/null/invalid */
  fallback?: React.ReactNode
  /** Locale for formatting (e.g., "en-US", "fr-FR") */
  locale?: string
  className?: string
}

/**
 * Formats a Jazz Unix timestamp (milliseconds) or Date for display.
 * Optimized for Jazz CoValue date fields which store timestamps as numbers.
 *
 * @example
 * ```tsx
 * // Relative format (default) - "2h ago", "Jun 1"
 * <FormattedDate date={payment.timestamp} />
 *
 * // Short format - "06/01/2024"
 * <FormattedDate date={subscription.createdAt} format="short" />
 *
 * // Long format - "June 1, 2024 at 2:30 PM"
 * <FormattedDate date={invoice.date} format="long" />
 *
 * // With fallback for pending/undefined dates
 * <FormattedDate date={refund.completedAt} fallback="Processing..." />
 *
 * // Muted style for secondary info
 * <FormattedDate date={event.timestamp} variant="muted" />
 * ```
 */
function FormattedDate({
  date,
  format = "relative",
  fallback = "—",
  locale,
  variant = "default",
  className,
}: TFormattedDateProps): React.ReactElement {
  const formatted = React.useMemo((): React.ReactNode => {
    const hasDate = date !== undefined && date !== null
    if (hasDate === false) {
      return fallback
    }

    // Convert to Date object (handles Unix ms, ISO strings, Date objects)
    const dateObject = typeof date === "number" ? new Date(date) : new Date(date)

    // Validate the date
    const isValidDate = Number.isNaN(dateObject.getTime()) === false
    if (isValidDate === false) {
      return fallback
    }

    if (format === "relative") {
      return formatTimestamp(dateObject, { locale })
    }

    if (format === "short") {
      return new Intl.DateTimeFormat(locale, {
        month: "numeric",
        day: "numeric",
        year: "numeric",
      }).format(dateObject)
    }

    if (format === "long") {
      return new Intl.DateTimeFormat(locale, {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(dateObject)
    }

    if (format === "iso") {
      return dateObject.toISOString()
    }

    return fallback
  }, [date, format, fallback, locale])

  return (
    <span className={cn(formattedDateVariants({ variant, className }))}>
      {formatted}
    </span>
  )
}

FormattedDate.displayName = "FormattedDate"

export { FormattedDate }
