import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import {
  Table as ShadTable,
  TableBody as ShadTableBody,
  TableCell as ShadTableCell,
  TableHead as ShadTableHead,
  TableHeader as ShadTableHeader,
  TableRow as ShadTableRow,
  TableFooter as ShadTableFooter,
  TableCaption as ShadTableCaption,
} from "@/components/shadcn-ui/table"
import { cn } from "@/lib/utils"

const dataTableDensityVariants = cva("", {
  variants: {
    density: {
      compact: "[&_td]:py-1.5 [&_th]:py-1.5",
      default: "[&_td]:py-2.5 [&_th]:py-2.5",
      comfortable: "[&_td]:py-4 [&_th]:py-4",
    },
  },
  defaultVariants: {
    density: "default",
  },
})

const dataTableSizeVariants = cva("", {
  variants: {
    size: {
      sm: "text-xs",
      default: "text-sm",
      lg: "text-base",
    },
  },
  defaultVariants: {
    size: "default",
  },
})

export interface TDataTableProps
  extends React.ComponentProps<typeof ShadTable>,
    VariantProps<typeof dataTableDensityVariants>,
    VariantProps<typeof dataTableSizeVariants> {
  /** Wrapper div className for styling the container */
  wrapperClassName?: string
  isLoading?: boolean
}

/**
 * @example
 * ```tsx
 * <DataTable density="compact" size="sm">
 *   <DataTableHeader>
 *     <DataTableRow>
 *       <DataTableHead>Name</DataTableHead>
 *       <DataTableHead>Status</DataTableHead>
 *     </DataTableRow>
 *   </DataTableHeader>
 *   <DataTableBody>
 *     <DataTableRow>
 *       <DataTableCell>Item 1</DataTableCell>
 *       <DataTableCell>Active</DataTableCell>
 *     </DataTableRow>
 *   </DataTableBody>
 * </DataTable>
 * ```
 */
function DataTable({
  ref,
  className,
  wrapperClassName,
  density = "default",
  size = "default",
  isLoading = false,
  children,
  ...props
}: TDataTableProps) {
  return (
    <div
      ref={ref}
      data-slot="data-table-wrapper"
      className={cn(
        "relative w-full overflow-x-auto bg-card",
        isLoading === true && "pointer-events-none opacity-60",
        wrapperClassName
      )}
    >
      <ShadTable
        data-slot="data-table"
        className={cn(
          dataTableDensityVariants({ density }),
          dataTableSizeVariants({ size }),
          className
        )}
        {...props}
      >
        {children}
      </ShadTable>
    </div>
  )
}

DataTable.displayName = "DataTable"

// Compound sub-components

const DataTableHeader = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof ShadTableHeader>) => (
  <ShadTableHeader
    ref={ref}
    data-slot="data-table-header"
    className={cn("bg-muted [&_tr]:border-b-border", className)}
    {...props}
  />
)
DataTableHeader.displayName = "DataTableHeader"

const DataTableBody = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof ShadTableBody>) => (
  <ShadTableBody
    ref={ref}
    data-slot="data-table-body"
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
)
DataTableBody.displayName = "DataTableBody"

const DataTableFooter = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof ShadTableFooter>) => (
  <ShadTableFooter
    ref={ref}
    data-slot="data-table-footer"
    className={cn(
      "border-t border-border bg-muted/50 font-medium",
      className
    )}
    {...props}
  />
)
DataTableFooter.displayName = "DataTableFooter"

const DataTableRow = ({
  ref,
  className,
  isSelected = false,
  ...props
}: React.ComponentProps<typeof ShadTableRow> & {
  isSelected?: boolean
}) => (
  <ShadTableRow
    ref={ref}
    data-slot="data-table-row"
    data-state={isSelected === true ? "selected" : undefined}
    className={cn(
      "border-b border-border transition-colors",
      "hover:bg-muted/50",
      "data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
)
DataTableRow.displayName = "DataTableRow"

const DataTableHead = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof ShadTableHead>) => (
  <ShadTableHead
    ref={ref}
    data-slot="data-table-head"
    className={cn(
      "h-9 px-3 text-left align-middle font-medium whitespace-nowrap text-foreground",
      "[&>[role=checkbox]]:pr-0",
      className
    )}
    {...props}
  />
)
DataTableHead.displayName = "DataTableHead"

const DataTableCell = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof ShadTableCell>) => (
  <ShadTableCell
    ref={ref}
    data-slot="data-table-cell"
    className={cn(
      "px-3 align-middle whitespace-nowrap",
      "[&>[role=checkbox]]:pr-0",
      className
    )}
    {...props}
  />
)
DataTableCell.displayName = "DataTableCell"

const DataTableCaption = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof ShadTableCaption>) => (
  <ShadTableCaption
    ref={ref}
    data-slot="data-table-caption"
    className={cn("mt-4 text-xs text-muted-foreground", className)}
    {...props}
  />
)
DataTableCaption.displayName = "DataTableCaption"

export {
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableFooter,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  DataTableCaption,
}
