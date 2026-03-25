import { cva, type VariantProps } from "class-variance-authority";
import { twMerge } from "tailwind-merge";
import React from "react";

/**
 * Badge - A small status indicator for labels, tags, and states.
 *
 * Used for webhook providers, environments, and status indicators.
 *
 * @example
 * ```tsx
 * <Badge variant="stripe">Stripe</Badge>
 * <Badge variant="production">Production</Badge>
 * ```
 */

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-mono font-medium",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground",
        stripe: "bg-blue-600/10 text-blue-600",
        polar: "bg-blue-700/10 text-blue-700",
        production: "bg-green-600/10 text-green-600",
        sandbox: "bg-yellow-600/10 text-yellow-600",
        active: "bg-green-600/10 text-green-600",
        inactive: "bg-red-600/10 text-red-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = ({
  ref,
  className,
  variant,
  children,
  ...props
}: BadgeProps & {
  ref?: React.RefObject<HTMLSpanElement>;
}): React.ReactElement => {
  return (
    <span
      ref={ref}
      data-slot="badge"
      className={twMerge(badgeVariants({ variant }), className)}
      {...props}
    >
      {children}
    </span>
  );
};
Badge.displayName = "Badge";

export { Badge, badgeVariants };
export type { BadgeProps };
