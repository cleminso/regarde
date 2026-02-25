import { Badge } from "#ui/badge";
import type { TSubscriptionStatus } from "@regarde-dev/core";

interface StatusBadgeProps {
  status: TSubscriptionStatus | string;
}

/**
 * Display a status as a color-coded badge.
 *
 * @returns The status badge component
 */
export function StatusBadge({ status }: StatusBadgeProps): React.ReactElement {
  const variantMap: Record<string, string> = {
    succeeded: "default",
    active: "default",
    failed: "destructive",
    past_due: "destructive",
    refunded: "secondary",
    revoked: "secondary",
    pending: "outline",
    trialing: "outline",
    canceled: "outline",
    expired: "outline",
    inactive: "outline",
  };

  const variant = variantMap[status] ?? "outline";

  return <Badge variant={variant as never}>{status}</Badge>;
}
