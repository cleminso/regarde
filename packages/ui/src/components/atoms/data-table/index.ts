// Main DataTable component and compound sub-components
export {
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableFooter,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  DataTableCaption,
} from "./dataTable"

export type { TDataTableProps } from "./dataTable"

// Column header with sorting
export { DataTableColumnHeader } from "./dataTableColumnHeader"

export type { TDataTableColumnHeaderProps } from "./dataTableColumnHeader"

// Row actions dropdown
export {
  DataTableRowActions,
  type TDataTableRowAction,
  type TDataTableRowActionVariant,
} from "./dataTableRowActions"

export type { TDataTableRowActionsProps } from "./dataTableRowActions"

// Empty states
export { DataTableEmptyState } from "./dataTableEmptyState"

export type { TDataTableEmptyStateProps } from "./dataTableEmptyState"

// Virtualization
export { DataTableVirtualizer } from "./dataTableVirtualizer"

export type { TDataTableVirtualizerProps } from "./dataTableVirtualizer"

// Formatted cells
export {
  DataTableDateCell,
  DataTableNumberCell,
  DataTableCurrencyCell,
  DataTableBadgeCell,
  formattedCellVariants,
} from "./dataTableFormattedCell"

export type {
  TDataTableDateCellProps,
  TDataTableNumberCellProps,
  TDataTableCurrencyCellProps,
  TDataTableBadgeCellProps,
} from "./dataTableFormattedCell"
