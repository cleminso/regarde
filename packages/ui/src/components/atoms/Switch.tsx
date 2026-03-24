import { Switch as BaseSwitch } from "@/components/shadcn-ui/switch"
import { cva, type VariantProps } from "class-variance-authority"
import { twMerge } from "tailwind-merge"
import React from "react"

/**
 * Branded switch component with Regarde styling.
 * A toggle control for binary states (on/off).
 *
 * @example
 * ```tsx
 * <Switch checked={enabled} onCheckedChange={setEnabled} />
 * <Switch size="sm" disabled />
 * ```
 */

const switchVariants = cva("", {
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

const Switch = ({
  ref,
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof BaseSwitch> &
  VariantProps<typeof switchVariants> & {
    ref?: React.RefObject<HTMLButtonElement>
  }) => {
  // Compute base classes with twMerge (strings only)
  const baseClasses = twMerge(
    // Regarde styling: slightly more compact
    "peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-all outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=default]:h-[18px] data-[size=default]:w-[32px] data-[size=sm]:h-[14px] data-[size=sm]:w-[24px] dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:bg-primary data-unchecked:bg-input dark:data-unchecked:bg-input/80 data-disabled:cursor-not-allowed data-disabled:opacity-50"
  )

  return (
    <BaseSwitch
      ref={ref}
      size={size}
      className={baseClasses}
      {...props}
    />
  )
}

Switch.displayName = "Switch"

export default Switch
export { Switch, switchVariants }

export type SwitchProps = React.ComponentProps<typeof BaseSwitch> &
  VariantProps<typeof switchVariants>
