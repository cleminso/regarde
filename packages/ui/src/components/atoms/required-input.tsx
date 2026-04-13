import { cn } from "@/lib/utils"
import { Label } from "./label"

export interface TRequiredInputProps {
  label: string
  isRequired?: boolean
  isValid?: boolean
  isInvalid?: boolean
  htmlFor?: string
  children: React.ReactNode
  className?: string
}

function RequiredInput({
  label,
  isRequired = false,
  isValid = false,
  isInvalid = false,
  htmlFor,
  children,
  className,
}: TRequiredInputProps) {
  const showInvalid = isInvalid === true
  const showRequired = isRequired && !isValid && !showInvalid
  const errorId = htmlFor ? `${htmlFor}-error` : undefined

  return (
    <div className={cn("grid gap-1", className)}>
      <Label htmlFor={htmlFor} className="mb-0 pb-0">{label}</Label>

      <div
        className="relative mt-0 pt-0"
        aria-invalid={isInvalid === true ? "true" : undefined}
        aria-required={isRequired === true ? "true" : undefined}
        aria-describedby={showInvalid === true || showRequired === true ? errorId : undefined}
      >
        {showInvalid && (
          <span
            id={errorId}
            className={cn(
              "absolute top-0 right-2 -translate-y-full rounded-t-sm px-2 py-0.5 text-xs",
              "bg-destructive/15 text-destructive",
              "transition-opacity"
            )}
            role="alert"
          >
            Invalid
          </span>
        )}

        {showRequired && (
          <span
            id={errorId}
            className={cn(
              "absolute top-0 right-2 -translate-y-full rounded-t-sm px-2 py-0.5 text-xs",
              "bg-destructive/15 text-destructive",
              "transition-opacity"
            )}
            role="alert"
          >
            Required
          </span>
        )}

        {children}
      </div>
    </div>
  )
}

RequiredInput.displayName = "RequiredInput"
export { RequiredInput }
