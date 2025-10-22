import { useCallback, useState } from "react";
import type { Loaded } from "jazz-tools";
import { RegistrationKey, getRegistrationKey, isKeyExpired } from "../auth";

export interface UseRegistrationKeyResult {
  key: string | null;
  keyId: string | null;
  expiresAt: number | null;
  isExpired: boolean;
  refresh: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useRegistrationKey(
  registrationKeyCoMap: Loaded<typeof RegistrationKey> | null | undefined,
): UseRegistrationKeyResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!registrationKeyCoMap) {
      setError("No registration key CoMap provided");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newKey = await getRegistrationKey({
        loadedRegistrationKeyCoMap: registrationKeyCoMap,
      });
      if (!newKey) {
        setError("Failed to update registration key");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [registrationKeyCoMap]);

  return {
    key: registrationKeyCoMap?.key ?? null,
    keyId: registrationKeyCoMap?.$jazz.id ?? null,
    expiresAt: registrationKeyCoMap?.expiresAt ?? null,
    isExpired: registrationKeyCoMap ? isKeyExpired(registrationKeyCoMap) : true,
    refresh,
    isLoading,
    error,
  };
}
