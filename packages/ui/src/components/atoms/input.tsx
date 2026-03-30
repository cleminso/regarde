import * as React from "react"
import { Input as ShadInput } from "@/components/shadcn-ui/input"
import { cn } from "@/lib/utils"

export type InputProps = React.ComponentProps<typeof ShadInput> & {
  preSlot?: React.ReactNode
  postSlot?: React.ReactNode
}

function Input({
  ref,
  preSlot,
  postSlot,
  className,
  ...props
}: InputProps) {
  return (
    <div className="relative flex w-full">
      {preSlot && (
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3 text-muted-foreground">
          {preSlot}
        </div>
      )}
      <ShadInput
        ref={ref}
        className={cn(
          "bg-input border-border text-foreground rounded-xs",
          "focus:z-10",
          preSlot && "pl-9",
          postSlot && "pr-9",
          className
        )}
        {...props}
      />
      {postSlot && (
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex items-center pr-3 text-muted-foreground">
          {postSlot}
        </div>
      )}
    </div>
  )
}

Input.displayName = "Input"
export { Input }
export default Input
