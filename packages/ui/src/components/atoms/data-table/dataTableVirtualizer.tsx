import * as React from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { cn } from "@/lib/utils"

export interface TDataTableVirtualizerProps<TData> {
  /** Data array to virtualize */
  data: TData[]
  /** Estimated row height in pixels */
  estimateSize: number
  /** Render function for each row - receives item, index, and style */
  renderRow: (
    item: TData,
    index: number,
    style: React.CSSProperties
  ) => React.ReactNode
  /** Number of items to render outside viewport (default: 5) */
  overscan?: number
  /** Padding at end of scroll (for bottom elements) */
  scrollPaddingEnd?: number
  /** Custom key function for items - receives index only, look up item from data array */
  getItemKey?: (index: number) => string | number
  /** Container className */
  className?: string
  /** Content wrapper className */
  contentClassName?: string
  /** Fixed height for container (required for virtualization) */
  containerHeight: number | string
}

/**
 * Virtualization wrapper for large data tables using TanStack Virtual.
 * Only renders visible rows + overscan for performance with large datasets.
 *
 * @example
 * ```tsx
 * // With TanStack Table rows
 * const { rows } = table.getRowModel();
 *
 * <DataTableVirtualizer
 *   data={rows}
 *   estimateSize={48}
 *   containerHeight={600}
 *   renderRow={(row, index, style) => (
 *     <DataTableRow key={row.id} style={style}>
 *       {row.getVisibleCells().map(cell => (
 *         <DataTableCell key={cell.id}>
 *           {flexRender(cell.column.columnDef.cell, cell.getContext())}
 *         </DataTableCell>
 *       ))}
 *     </DataTableRow>
 *   )}
 * />
 * ```
 */
function DataTableVirtualizer<TData>({
  data,
  estimateSize,
  renderRow,
  overscan = 5,
  scrollPaddingEnd = 0,
  getItemKey,
  className,
  contentClassName,
  containerHeight,
}: TDataTableVirtualizerProps<TData>): React.ReactElement {
  const parentRef = React.useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
    scrollPaddingEnd,
    getItemKey: getItemKey ?? ((index: number) => {
      const item = data[index];
      return item && typeof item === 'object' && 'id' in item ? (item as { id: string | number }).id : index;
    }),
  })

  const virtualItems = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()

  return (
    <div
      ref={parentRef}
      data-slot="data-table-virtualizer"
      className={cn("relative overflow-auto", className)}
      style={{ height: containerHeight }}
    >
      <div
        data-slot="data-table-virtualizer-content"
        style={{
          height: `${totalSize}px`,
          width: "100%",
          position: "relative",
        }}
        className={contentClassName}
      >
        {virtualItems.map((virtualItem) => {
          const item = data[virtualItem.index]
          if (item === undefined) return null

          const style: React.CSSProperties = {
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: `${virtualItem.size}px`,
            transform: `translateY(${virtualItem.start}px)`,
          }

          return (
            <React.Fragment key={virtualItem.key}>
              {renderRow(item, virtualItem.index, style)}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

DataTableVirtualizer.displayName = "DataTableVirtualizer"

export { DataTableVirtualizer }
