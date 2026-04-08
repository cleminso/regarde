import { Label as ShadLabel } from "@/components/shadcn-ui/label"
import { cn } from "@/lib/utils"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <ShadLabel
      className={cn("text-sm font-medium", className)}
      {...props}
    />
  )
}
Label.displayName = "Label"

export { Label }
export default Label
