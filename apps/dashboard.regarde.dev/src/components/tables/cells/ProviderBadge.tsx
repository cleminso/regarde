import { Badge } from "#ui/badge";
import type { TPaymentProvider } from "@regarde-dev/core";

interface ProviderBadgeProps {
  provider: TPaymentProvider;
}

/**
 * Display a payment provider as a badge.
 *
 * @returns The provider badge component
 */
export function ProviderBadge({
  provider,
}: ProviderBadgeProps): React.ReactElement {
  return <Badge variant="outline">{provider}</Badge>;
}
