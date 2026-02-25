import { Badge } from "#ui/badge";
import type { TMode } from "@regarde-dev/core";

interface ModeBadgeProps {
  mode?: TMode;
}

/**
 * Display test/production mode as a badge.
 *
 * @returns The mode badge component
 */
export function ModeBadge({ mode }: ModeBadgeProps): React.ReactElement {
  if (mode === undefined || mode === null) {
    return <Badge variant="outline">—</Badge>;
  }

  const isTestMode = mode === "test";

  return <Badge variant={isTestMode ? "secondary" : "outline"}>{mode}</Badge>;
}
