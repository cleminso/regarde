import { cva, type VariantProps } from "class-variance-authority"
import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { cn } from "@/lib/utils"

const switchVariants = cva(
  "group relative inline-flex shrink-0 items-center rounded-sm border border-transparent transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "h-4 w-7",
        default: "h-5 w-9",
        lg: "h-6 w-11",
      },
      variant: {
        default: "bg-input data-[checked]:bg-primary",
        destructive: "bg-destructive data-[checked]:bg-destructive",
        success: "bg-success data-[checked]:bg-success",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
)

const switchThumbVariants = cva(
  "pointer-events-none block rounded-xs bg-white ring-0 transition-transform duration-200 ease-in-out shadow-sm",
  {
    variants: {
      size: {
        sm: "h-3 w-3 translate-x-0.5 data-[checked]:translate-x-3.5",
        default: "h-3.5 w-3.5 translate-x-0.5 data-[checked]:translate-x-4.5",
        lg: "h-5 w-5 translate-x-0.5 data-[checked]:translate-x-5.5",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

export interface TSwitchProps
  extends SwitchPrimitive.Root.Props,
    VariantProps<typeof switchVariants> {}

function Switch({
  className,
  size = "default",
  variant = "default",
  ...props
}: TSwitchProps) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(switchVariants({ size, variant }), className)}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={switchThumbVariants({ size })}
      />
    </SwitchPrimitive.Root>
  )
}

Switch.displayName = "Switch"

export { Switch }
