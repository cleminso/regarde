import { Eye, EyeOff } from "lucide-react"
import { Input as BaseInput } from "@base-ui/react/input"
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from "react"
import { cn } from "@/lib/utils"

export interface TSensitiveInputProps
  extends Omit<
    ComponentPropsWithoutRef<"input">,
    "size" | "type" | "value" | "defaultValue"
  > {
  /** Controlled value */
  value?: string
  /** Uncontrolled default value */
  defaultValue?: string
  /** Simplified change handler receiving just the value */
  onValueChange?: (value: string) => void
  /** Callback fired after value is copied to clipboard */
  onCopy?: () => void
}

type TMode = "masked" | "revealed" | "empty"

/**
 * @example
 * ```tsx
 * <SensitiveInput
 *   value={secret}
 *   onValueChange={setSecret}
 *   onCopy={() => toast.success("Copied")}
 * />
 * ```
 * @returns The sensitive input component
 */
export function SensitiveInput({
  value: controlledValue,
  defaultValue = "",
  onChange,
  onValueChange,
  onCopy,
  disabled = false,
  readOnly = false,
  id,
  autoComplete = "off",
  className,
  ...inputProps
}: TSensitiveInputProps) {
  const isControlled = controlledValue !== undefined
  const [internalValue, setInternalValue] = useState(defaultValue)
  const value = isControlled ? controlledValue : internalValue
  const hasValue = value.length > 0

  const [mode, setMode] = useState<TMode>(() =>
    hasValue ? "masked" : "empty"
  )

  const [copied, setCopied] = useState(false)

  const inputRef = useRef<HTMLInputElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const liveRegionId = useId()
  const generatedId = useId()
  const inputId = id ?? generatedId
  const maskedInstructionId = useId()

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copied) {
      const timeoutId = setTimeout(() => setCopied(false), 2000)
      return () => clearTimeout(timeoutId)
    }
  }, [copied])

  const copyToClipboard = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      try {
        if (
          typeof navigator !== "undefined" &&
          navigator.clipboard &&
          typeof navigator.clipboard.writeText === "function"
        ) {
          await navigator.clipboard.writeText(value)
          setCopied(true)
          onCopy?.()
          // After copying, mask the input and blur the button
          if (hasValue) {
            setMode("masked")
          }
          // Blur the button so focus is not inside container
          if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.blur()
          }
          return
        }
      } catch {
        // Fall through to manual fallback
      }

      if (typeof document !== "undefined") {
        const textarea = document.createElement("textarea")
        textarea.value = value
        textarea.setAttribute("readonly", "")
        textarea.style.position = "absolute"
        textarea.style.left = "-9999px"
        document.body.appendChild(textarea)
        const selection = document.getSelection()
        const previousRange = selection?.rangeCount
          ? selection.getRangeAt(0)
          : null
        textarea.select()
        try {
          document.execCommand("copy")
          setCopied(true)
          onCopy?.()
        } catch (error) {
          console.warn("Clipboard copy failed", error)
        } finally {
          document.body.removeChild(textarea)
          if (previousRange) {
            selection?.removeAllRanges()
            selection?.addRange(previousRange)
          }
          // After copying, mask the input and blur the button
          if (hasValue) {
            setMode("masked")
          }
          if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.blur()
          }
        }
      }
    },
    [value, onCopy, hasValue]
  )

  // Sync mode when value changes externally
  const prevHasValueRef = useRef(hasValue)
  if (prevHasValueRef.current !== hasValue) {
    prevHasValueRef.current = hasValue
    // Transition to empty mode when value is cleared (from masked or revealed)
    if (!hasValue && (mode === "masked" || mode === "revealed")) {
      setMode("empty")
    }
  }

  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return
      // Ignore clicks that originated from outside (e.g., label click focusing input)
      // Label clicks trigger a click on the input, but the click coordinates are outside the container
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const isClickInsideContainer =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        if (!isClickInsideContainer) return
      }
      // Only reveal if currently masked - prevents toggling when already revealed
      if (mode === "masked" && hasValue) {
        setMode("revealed")
        if (!readOnly) {
          setTimeout(() => inputRef.current?.focus(), 0)
        }
      }
    },
    [mode, hasValue, disabled, readOnly]
  )

  const handleToggleVisibility = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      if (mode === "revealed") {
        setMode("masked")
      } else if (mode === "empty" && hasValue) {
        setMode("revealed")
      }
    },
    [mode, hasValue]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      if (!isControlled) {
        setInternalValue(newValue)
      }
      // When typing into an empty field, switch to revealed mode
      // so the input shows as type="text" instead of type="password"
      if (mode === "empty" && newValue.length > 0) {
        setMode("revealed")
      }
      onChange?.(e)
      onValueChange?.(newValue)
    },
    [isControlled, onChange, onValueChange, mode]
  )

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      // Don't mask if focus is moving to a button inside the container (copy/eye buttons)
      if (
        containerRef.current &&
        e.relatedTarget instanceof Node &&
        containerRef.current.contains(e.relatedTarget)
      ) {
        return
      }
      if (hasValue) {
        setMode("masked")
      }
    },
    [hasValue]
  )

  const handleContainerKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return
      if (mode === "masked" && hasValue) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          setMode("revealed")
          if (!readOnly) {
            setTimeout(() => inputRef.current?.focus(), 0)
          }
        }
      }
    },
    [mode, hasValue, disabled, readOnly]
  )

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (mode === "revealed" && e.key === "Escape") {
        setMode("masked")
        // Move focus to container to avoid focus trap (input becomes tabIndex={-1})
        setTimeout(() => containerRef.current?.focus(), 0)
      }
    },
    [mode]
  )

  const isMaskedWithValue = mode === "masked" && hasValue
  const showEyeButton =
    !disabled && hasValue && (mode === "revealed" || mode === "empty")

  const containerClassName = cn(
    "group/container relative flex w-full items-center rounded-sm border border-border bg-input px-3 py-2",
    "focus-within:outline focus-within:outline-1 focus-within:outline-ring focus-within:outline-offset-[-1px]",
    isMaskedWithValue && !disabled && "cursor-pointer",
    disabled && "cursor-not-allowed opacity-50",
    className
  )

  const containerContent = (
    <>
      {/* Input - defines the width, always rendered */}
      <BaseInput
        ref={inputRef}
        id={inputId}
        type={mode === "revealed" ? "text" : "password"}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleInputKeyDown}
        disabled={disabled}
        readOnly={readOnly || isMaskedWithValue}
        autoComplete={autoComplete}
        tabIndex={isMaskedWithValue ? -1 : 0}
        className={cn(
          "w-full border-0 bg-transparent p-0 text-foreground ring-0 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:text-muted-foreground",
          "pr-10",
          isMaskedWithValue && "pointer-events-none text-transparent"
        )}
        aria-hidden={isMaskedWithValue}
        {...inputProps}
      />

      {/* Mask overlay */}
      <span
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 flex items-center overflow-hidden select-none px-3",
          "right-10",
          !isMaskedWithValue && "invisible",
          isMaskedWithValue && "pointer-events-auto",
          "text-foreground",
          "group/mask"
        )}
        aria-hidden="true"
      >
        <span className="relative">
          <span
            className={cn(
              isMaskedWithValue &&
                !disabled &&
                "group-focus-within/container:invisible group-hover/mask:invisible"
            )}
          >
            ••••••••
          </span>
          {isMaskedWithValue && !disabled && (
            <span className="invisible text-sm absolute left-0 top-1/2 -translate-y-1/2 whitespace-nowrap text-muted-foreground group-focus-within/container:visible group-hover/mask:visible">
              Click to reveal
            </span>
          )}
        </span>
      </span>

      <button
        type="button"
        onClick={handleToggleVisibility}
        onKeyDown={(e) => e.stopPropagation()}
        aria-label={mode === "revealed" ? "Hide value" : "Reveal value"}
        tabIndex={showEyeButton ? 0 : -1}
        className={cn(
          "absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground focus:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-sm",
          "bg-transparent border-none shadow-none p-0 m-0 h-auto min-h-0 inline-flex items-center justify-center",
          "size-4",
          !showEyeButton && "pointer-events-none opacity-0"
        )}
      >
        {mode === "revealed" ? (
          <EyeOff className="size-full" />
        ) : (
          <Eye className="size-full" />
        )}
      </button>

      {/* Copy tab - appears on hover/focus at top right (hidden when disabled) */}
      {hasValue && !disabled && (
        <button
          type="button"
          onClick={copyToClipboard}
          onKeyDown={(e) => e.stopPropagation()}
          aria-label={copied ? "Copied" : "Copy to clipboard"}
          className={cn(
            "absolute -top-px right-2 -translate-y-full cursor-pointer rounded-t-sm bg-primary px-2 py-0.5 text-xs text-primary-foreground opacity-0 transition-opacity group-focus-within/container:opacity-100 group-hover/container:opacity-100 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
            "border-none shadow-none m-0 h-auto min-h-0"
          )}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      )}
    </>
  )

  return (
    <div>
      {isMaskedWithValue ? (
        <div
          ref={containerRef}
          // Cannot use <button> here because containerContent contains interactive button elements (Copy, Reveal).
          // Using role="button" with proper keyboard handling instead.
          role="button"
          tabIndex={disabled ? -1 : 0}
          className={containerClassName}
          onClick={handleContainerClick}
          onKeyDown={handleContainerKeyDown}
          aria-label="Sensitive value, masked."
          aria-describedby={`${maskedInstructionId} ${liveRegionId}`}
          aria-disabled={disabled}
        >
          {containerContent}
        </div>
      ) : (
        <div ref={containerRef} className={containerClassName}>
          {containerContent}
        </div>
      )}
      {isMaskedWithValue && (
        <span id={maskedInstructionId} className="sr-only">
          Click or press Enter to reveal.
        </span>
      )}
      <span id={liveRegionId} className="sr-only" aria-live="polite">
        {mode === "masked" && hasValue && "Value hidden"}
        {copied && "Copied to clipboard"}
      </span>
    </div>
  )
}

SensitiveInput.displayName = "SensitiveInput"
