import { Toaster as ShadToaster } from "@/components/shadcn-ui/sonner";
import type { ToasterProps as ShadToasterProps } from "sonner";
import { cn } from "@/lib/utils";

export type ToasterProps = ShadToasterProps;

/**
 * Regarde-styled Toaster component.
 * Wraps shadcn Toaster with branded styling.
 *
 * @example
 * ```tsx
 * <Toaster position="bottom-right" />
 * ```
 */
function Toaster({ className, toastOptions, style, ...props }: ToasterProps) {
  return (
    <ShadToaster
      className={cn("toaster group", className)}
      style={{
        "--normal-bg": "var(--popover)",
        "--normal-text": "var(--popover-foreground)",
        "--normal-border": "var(--border)",
        "--border-radius": "var(--radius-sm)",
        ...style,
      } as React.CSSProperties}
      toastOptions={{
        ...toastOptions,
        classNames: {
          ...toastOptions?.classNames,
          toast: cn(
            "cn-toast px-4 py-3",
            toastOptions?.classNames?.toast
          ),
        },
      }}
      {...props}
    />
  );
}

Toaster.displayName = "Toaster";

export { Toaster };
