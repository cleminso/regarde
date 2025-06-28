import { OnboardingAccount } from "../schema";

export interface VerificationResult {
  isValid: boolean;
  error?: string;
}

export async function verifyRegistrationKey(
  jazzAccountId: string,
  providedKey: string,
  worker: any,
): Promise<VerificationResult> {
  try {
    if (!jazzAccountId || !providedKey) {
      return { isValid: false, error: "Missing jazzAccountId or key" };
    }

    if (!worker) {
      return { isValid: false, error: "Worker instance not available" };
    }

    const userAccount = await worker.load(jazzAccountId, OnboardingAccount, {
      root: {
        registrationKey: true,
      },
    });

    if (!userAccount?.root) {
      return { isValid: false, error: "User account or root not found" };
    }

    const storedKey = userAccount.root.registrationKey?.key;
    if (!storedKey) {
      return {
        isValid: false,
        error: "No registration key found for this account",
      };
    }

    if (storedKey !== providedKey) {
      return { isValid: false, error: "Invalid registration key" };
    }

    return { isValid: true };
  } catch (error) {
    console.error("Error verifying registration key:", error);
    return { isValid: false, error: "Verification failed" };
  }
}
