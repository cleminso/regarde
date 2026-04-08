import { Textarea as ShadTextarea } from "@/components/shadcn-ui/textarea"
import { cn } from "@/lib/utils"

function Textarea({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof ShadTextarea>) {
  return (
    <ShadTextarea
      ref={ref}
      className={cn(
        "bg-input border-border text-foreground resize-none rounded-sm focus-visible:ring-0",
        className
      )}
      {...props}
    />
  )
}
Textarea.displayName = "Textarea"

export { Textarea }
export default Textarea
