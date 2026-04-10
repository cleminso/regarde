import * as React from "react"
import { MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/atoms/dropdownMenu"
import { cn } from "@/lib/utils"

/** Visual variant for action items */
export type TDataTableRowActionVariant = "default" | "destructive" | "separator"

/** Individual action definition for a row */
export interface TDataTableRowAction<TData = unknown> {
  /** Unique identifier for the action */
  id: string
  /** Display label */
  label: string
  /** Optional icon element */
  icon?: React.ReactNode
  /** Visual variant */
  variant?: TDataTableRowActionVariant
  /** Keyboard shortcut text (decorative) */
  shortcut?: string
  /** Function to determine if action is visible for this row */
  visible?: (row: TData) => boolean
  /** Function to determine if action is disabled for this row */
  disabled?: (row: TData) => boolean
  /** Click handler - can be async for loading state support */
  onClick: (row: TData) => void | Promise<void>
}

export interface TDataTableRowActionsProps<TData = unknown> {
  /** The row data object (passed to action handlers) */
  row: TData
  /** Array of action definitions */
  actions: TDataTableRowAction<TData>[]
  /** Accessible label for the trigger button */
  triggerLabel?: string
  /** Dropdown menu alignment */
  align?: "start" | "center" | "end"
  /** Dropdown menu side */
  side?: "top" | "right" | "bottom" | "left"
  className?: string
}

/**
 * Dropdown menu for row-level actions in data tables.
 * Supports async actions with loading states, per-row visibility, and destructive variants.
 *
 * @example
 * ```tsx
 * // In column definitions
 * {
 *   id: "actions",
 *   cell: ({ row }) => (
 *     <DataTableRowActions
 *       row={row.original}
 *       actions={[
 *         {
 *           id: "view",
 *           label: "View",
 *           icon: <Eye className="size-4" />,
 *           onClick: (webhook) => router.push(`/webhooks/${webhook.$jazz.id}`),
 *         },
 *         {
 *           id: "edit",
 *           label: "Edit",
 *           visible: (webhook) => webhook.isEnabled === true,
 *           onClick: handleEdit,
 *         },
 *         { variant: "separator" },
 *         {
 *           id: "delete",
 *           label: "Delete",
 *           variant: "destructive",
 *           onClick: handleDelete,
 *         },
 *       ]}
 *     />
 *   ),
 * }
 * ```
 */
function DataTableRowActions<TData>({
  row,
  actions,
  triggerLabel = "Open menu",
  align = "end",
  side = "bottom",
  className,
}: TDataTableRowActionsProps<TData>): React.ReactElement | null {
  const [loadingActionId, setLoadingActionId] = React.useState<string | null>(
    null
  )

  // Filter actions based on row-specific visibility
  const visibleActions = actions.filter((action) => {
    if (action.variant === "separator") return true
    if (action.visible !== undefined) {
      return action.visible(row) === true
    }
    return true
  })

  const hasVisibleActions = visibleActions.some(
    (action) => action.variant !== "separator"
  )

  if (hasVisibleActions === false) {
    return null
  }

  const handleActionClick = async (
    action: TDataTableRowAction<TData>
  ): Promise<void> => {
    if (action.variant === "separator") return

    const isDisabled =
      action.disabled !== undefined && action.disabled(row) === true
    if (isDisabled === true) return

    const result = action.onClick(row)

    // Handle async actions with loading state
    if (result instanceof Promise) {
      setLoadingActionId(action.id)
      try {
        await result
      } finally {
        setLoadingActionId(null)
      }
    }
  }

  const isActionLoading = (actionId: string): boolean => {
    return loadingActionId === actionId
  }

  const isActionDisabled = (action: TDataTableRowAction<TData>): boolean => {
    if (loadingActionId !== null) return true
    if (action.disabled !== undefined) {
      return action.disabled(row) === true
    }
    return false
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex size-7 items-center justify-center rounded-sm hover:bg-secondary hover:border hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <MoreHorizontal className="size-4" />
        <span className="sr-only">{triggerLabel}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        side={side}
        className="min-w-fit whitespace-nowrap"
      >
        {visibleActions.map((action, index) => {
          if (action.variant === "separator") {
            return <DropdownMenuSeparator key={`sep-${index}`} />
          }

          const isLoading = isActionLoading(action.id)
          const isDisabled = isActionDisabled(action)

          return (
            <DropdownMenuItem
              key={action.id}
              onClick={(e) => {
                e.stopPropagation()
                void handleActionClick(action)
              }}
              disabled={isDisabled}
              data-variant={action.variant}
              className={cn(
                "justify-end",
                action.variant === "destructive" &&
                  "text-destructive focus:text-destructive"
              )}
            >
              {action.icon !== undefined && (
                <span className="mr-2">{action.icon}</span>
              )}
              <span>{action.label}</span>
              {action.shortcut !== undefined && (
                <DropdownMenuShortcut>
                  {action.shortcut}
                </DropdownMenuShortcut>
              )}
              {isLoading === true && (
                <span className="ml-auto">
                  <svg
                    className="size-3 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </span>
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

DataTableRowActions.displayName = "DataTableRowActions"

export { DataTableRowActions }
