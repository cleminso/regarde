import * as React from "react"
import type { Column } from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { Button as ShadButton } from "@/components/shadcn-ui/button"
import { cn } from "@/lib/utils"

export interface TDataTableColumnHeaderProps<TData, TValue> {
  /** TanStack Table column instance */
  column: Column<TData, TValue>
  /** Header title text */
  title: string
  /** Custom ascending sort icon (default: ArrowUp) */
  iconAsc?: React.ReactNode
  /** Custom descending sort icon (default: ArrowDown) */
  iconDesc?: React.ReactNode
  /** Custom default/no-sort icon (default: ArrowUpDown) */
  iconDefault?: React.ReactNode
  className?: string
}

/**
 * Sortable column header for TanStack Table.
 * Automatically shows sort indicators and handles toggle logic.
 *
 * @example
 * ```tsx
 * // In column definitions
 * {
 *   accessorKey: "name",
 *   header: ({ column }) => (
 *     <DataTableColumnHeader column={column} title="Name" />
 *   ),
 *   enableSorting: true,
 * }
 * ```
 */
function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  iconAsc,
  iconDesc,
  iconDefault,
  className,
}: TDataTableColumnHeaderProps<TData, TValue>): React.ReactElement {
  const isSortable = column.getCanSort() === true
  const sortDirection = column.getIsSorted()

  const handleClick = (): void => {
    if (isSortable === true) {
      column.toggleSorting(sortDirection === "asc")
    }
  }

  const renderIcon = (): React.ReactNode => {
    if (sortDirection === "desc") {
      return (
        iconDesc ?? <ArrowDown className="ml-2 size-3.5 text-foreground" />
      )
    }
    if (sortDirection === "asc") {
      return iconAsc ?? <ArrowUp className="ml-2 size-3.5 text-foreground" />
    }
    return (
      iconDefault ?? (
        <ArrowUpDown className="ml-2 size-3.5 text-muted-foreground opacity-50" />
      )
    )
  }

  if (isSortable === false) {
    return <span className={cn("font-medium", className)}>{title}</span>
  }

  return (
    <ShadButton
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={cn(
        "h-8 px-2 font-medium hover:bg-transparent",
        "data-[state=open]:bg-accent",
        className
      )}
    >
      <span>{title}</span>
      {renderIcon()}
    </ShadButton>
  )
}

DataTableColumnHeader.displayName = "DataTableColumnHeader"

export { DataTableColumnHeader }
