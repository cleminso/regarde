import { useCallback, useState } from "react";
import type { Loaded } from "jazz-tools";
import { RegardeAuth, getRegardeAuth, isTokenExpired } from "../auth";

export interface UseRegardeAuthResult {
  token: string | null;
  tokenId: string | null;
  expiresAt: number | null;
  isExpired: boolean;
  refresh: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useRegardeAuth(
  RegardeAuthCoMap: Loaded<typeof RegardeAuth> | null | undefined,
): UseRegardeAuthResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!RegardeAuthCoMap) {
      setError("No registration token CoMap provided");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newToken = await getRegardeAuth({
        loadedRegardeAuthCoMap: RegardeAuthCoMap,
      });
      if (!newToken) {
        setError("Failed to update registration token");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [RegardeAuthCoMap]);

  return {
    token: RegardeAuthCoMap?.token ?? null,
    tokenId: RegardeAuthCoMap?.$jazz.id ?? null,
    expiresAt: RegardeAuthCoMap?.expiresAt ?? null,
    isExpired: RegardeAuthCoMap ? isTokenExpired(RegardeAuthCoMap) : true,
    refresh,
    isLoading,
    error,
  };
}
