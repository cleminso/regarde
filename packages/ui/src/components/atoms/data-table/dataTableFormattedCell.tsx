import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { FormattedDate, type TDateFormat } from "@/components/atoms/formattedDate"

const formattedCellVariants = cva("tabular-nums", {
  variants: {
    align: {
      left: "text-left",
      center: "text-center",
      right: "text-right",
    },
    variant: {
      default: "",
      muted: "text-muted-foreground",
      dim: "text-xs text-muted-foreground",
    },
  },
  defaultVariants: {
    align: "left",
    variant: "default",
  },
})

// Date Cell Component
export interface TDataTableDateCellProps
  extends VariantProps<typeof formattedCellVariants> {
  /** Jazz Unix timestamp (ms), Date, or ISO string */
  date: number | Date | string | undefined | null
  /** Date format style */
  format?: TDateFormat
  /** Fallback text for undefined/invalid dates */
  fallback?: React.ReactNode
  /** Locale for formatting */
  locale?: string
  className?: string
}

/**
 * Table cell for displaying dates from Jazz timestamps.
 * Wrapper around FormattedDate optimized for table cells.
 *
 * @example
 * ```tsx
 * // In column definitions
 * {
 *   accessorKey: "timestamp",
 *   header: "Date",
 *   cell: ({ getValue }) => (
 *     <DataTableDateCell date={getValue() as number} format="relative" />
 *   ),
 * }
 * ```
 */
function DataTableDateCell({
  date,
  format = "relative",
  fallback = "—",
  locale,
  align = "left",
  variant = "muted",
  className,
}: TDataTableDateCellProps): React.ReactElement {
  return (
    <span className={cn(formattedCellVariants({ align, variant }), className)}>
      <FormattedDate
        date={date}
        format={format}
        fallback={fallback}
        locale={locale}
        variant={variant}
      />
    </span>
  )
}

DataTableDateCell.displayName = "DataTableDateCell"

// Number Cell Component
export interface TDataTableNumberCellProps
  extends VariantProps<typeof formattedCellVariants> {
  /** Numeric value to display */
  value: number | undefined | null
  /** Number of decimal places */
  decimals?: number
  /** Prefix (e.g., "$", "€") */
  prefix?: string
  /** Suffix (e.g., "%", " items") */
  suffix?: string
  /** Minimum fraction digits (overrides decimals if set) */
  minimumFractionDigits?: number
  /** Maximum fraction digits (overrides decimals if set) */
  maximumFractionDigits?: number
  /** Locale for number formatting */
  locale?: string
  /** Fallback for undefined/null values */
  fallback?: React.ReactNode
  className?: string
}

/**
 * Table cell for displaying formatted numbers.
 * Handles decimal places, prefixes, suffixes, and locale formatting.
 *
 * @example
 * ```tsx
 * // Currency
 * <DataTableNumberCell value={amount} prefix="$" decimals={2} align="right" />
 *
 * // Percentage
 * <DataTableNumberCell value={rate} suffix="%" decimals={1} />
 *
 * // Large numbers
 * <DataTableNumberCell value={count} suffix=" items" />
 * ```
 */
function DataTableNumberCell({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  minimumFractionDigits,
  maximumFractionDigits,
  locale,
  fallback = "—",
  align = "right",
  variant = "default",
  className,
}: TDataTableNumberCellProps): React.ReactElement {
  const formattedValue = React.useMemo((): React.ReactNode => {
    if (value === undefined || value === null) {
      return fallback
    }

    const opts: Intl.NumberFormatOptions = {
      minimumFractionDigits:
        minimumFractionDigits !== undefined
          ? minimumFractionDigits
          : decimals,
      maximumFractionDigits:
        maximumFractionDigits !== undefined
          ? maximumFractionDigits
          : decimals,
    }

    const formatted = value.toLocaleString(locale, opts)
    return `${prefix}${formatted}${suffix}`
  }, [
    value,
    decimals,
    prefix,
    suffix,
    minimumFractionDigits,
    maximumFractionDigits,
    locale,
    fallback,
  ])

  return (
    <span className={cn(formattedCellVariants({ align, variant }), className)}>
      {formattedValue}
    </span>
  )
}

DataTableNumberCell.displayName = "DataTableNumberCell"

// Currency Cell Component
export interface TDataTableCurrencyCellProps
  extends Omit<
    TDataTableNumberCellProps,
    "prefix" | "suffix" | "value"
  > {
  /** Amount in currency units */
  amount: number | undefined | null
  /** Currency code (default: USD) */
  currency?: string
  /** Locale for formatting (default: en-US) */
  locale?: string
}

/**
 * Table cell for displaying currency amounts.
 * Uses Intl.NumberFormat for proper currency formatting.
 *
 * @example
 * ```tsx
 * // In column definitions
 * {
 *   accessorKey: "amount",
 *   header: "Amount",
 *   cell: ({ row }) => (
 *     <DataTableCurrencyCell
 *       amount={row.original.amount}
 *       currency={row.original.currency}
 *       align="right"
 *     />
 *   ),
 * }
 * ```
 */
function DataTableCurrencyCell({
  amount,
  currency = "USD",
  locale = "en-US",
  align = "right",
  variant = "default",
  fallback = "—",
  className,
}: TDataTableCurrencyCellProps): React.ReactElement {
  const formattedValue = React.useMemo((): React.ReactNode => {
    if (amount === undefined || amount === null) {
      return fallback
    }

    return amount.toLocaleString(locale, {
      style: "currency",
      currency,
    })
  }, [amount, currency, locale, fallback])

  return (
    <span className={cn(formattedCellVariants({ align, variant }), className)}>
      {formattedValue}
    </span>
  )
}

DataTableCurrencyCell.displayName = "DataTableCurrencyCell"

// Badge/Status Cell Component
export interface TDataTableBadgeCellProps
  extends Omit<VariantProps<typeof formattedCellVariants>, "variant"> {
  /** Status value to display */
  value: string
  /** Function to determine badge color from value */
  getVariant?: (
    value: string
  ) => "default" | "success" | "warning" | "error" | "info"
  className?: string
}

/**
 * Table cell for displaying status badges.
 * Colored badges for statuses like "active", "pending", "failed", etc.
 *
 * @example
 * ```tsx
 * // In column definitions
 * {
 *   accessorKey: "status",
 *   header: "Status",
 *   cell: ({ getValue }) => (
 *     <DataTableBadgeCell
 *       value={getValue() as string}
 *       getVariant={(status) =>
 *         status === "active" ? "success" :
 *         status === "pending" ? "warning" : "default"
 *       }
 *       align="center"
 *     />
 *   ),
 * }
 * ```
 */
function DataTableBadgeCell({
  value,
  getVariant,
  align = "center",
  className,
}: TDataTableBadgeCellProps): React.ReactElement {
  const variant = getVariant?.(value) ?? "default"

  const variantStyles: Record<string, string> = {
    default: "bg-muted text-muted-foreground",
    success:
      "bg-green-500/15 text-green-600 dark:bg-green-500/10 dark:text-green-400",
    warning:
      "bg-yellow-500/15 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400",
    error:
      "bg-red-500/15 text-red-600 dark:bg-red-500/10 dark:text-red-400",
    info: "bg-blue-500/15 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-xs px-2 py-0.5 text-xs font-medium",
        variantStyles[variant],
        formattedCellVariants({ align }),
        className
      )}
    >
      {value}
    </span>
  )
}

DataTableBadgeCell.displayName = "DataTableBadgeCell"

export {
  DataTableDateCell,
  DataTableNumberCell,
  DataTableCurrencyCell,
  DataTableBadgeCell,
  formattedCellVariants,
}
