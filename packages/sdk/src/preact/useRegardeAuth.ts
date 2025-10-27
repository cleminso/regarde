import { useCallback, useState } from "preact/hooks";
import { Loaded } from "jazz-tools";
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
  regardeAuthCoMap: Loaded<typeof RegardeAuth> | null | undefined,
): UseRegardeAuthResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!regardeAuthCoMap) {
      setError("No registration token CoMap provided");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newToken = await getRegardeAuth({
        loadedRegardeAuthCoMap: regardeAuthCoMap,
      });
      if (!newToken) {
        setError("Failed to update registration token");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [regardeAuthCoMap]);

  return {
    token: regardeAuthCoMap?.token ?? null,
    tokenId: regardeAuthCoMap?.$jazz.id ?? null,
    expiresAt: regardeAuthCoMap?.expiresAt ?? null,
    isExpired: regardeAuthCoMap ? isTokenExpired(regardeAuthCoMap) : true,
    refresh,
    isLoading,
    error,
  };
}
