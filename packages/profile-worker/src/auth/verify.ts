import { OnboardingAccount } from "../schema";

export interface VerificationResult {
  isValid: boolean;
  error?: string;
}

export async function verifyRegistrationKey(
  jazzAccountId: string,
  providedKey: string,
): Promise<VerificationResult> {
  try {
    if (!jazzAccountId || !providedKey) {
      return { isValid: false, error: "Missing jazzAccountId or key" };
    }

    let userAccount: any = null;
    let accountLoadError: string | null = null;

    try {
      const loadPromise = OnboardingAccount.load(jazzAccountId, {
        resolve: {
          root: {
            registrationKey: true,
          },
        },
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Account loading timeout")), 10000),
      );

      userAccount = await Promise.race([loadPromise, timeoutPromise]);
    } catch (accountError: any) {
      accountLoadError =
        accountError?.message || "Unknown account loading error";
      console.warn(
        `Account ${jazzAccountId} could not be loaded: ${accountLoadError}`,
      );
    }

    if (!userAccount?.root) {
      return {
        isValid: false,
        error: accountLoadError || "User account or root not found",
      };
    }

    const storedKeyData = userAccount.root.registrationKey;
    if (!storedKeyData) {
      return {
        isValid: false,
        error: "No registration key found for this account",
      };
    }

    if (storedKeyData.key !== providedKey) {
      return { isValid: false, error: "Invalid registration key" };
    }

    if (storedKeyData.expiresAt && Date.now() > storedKeyData.expiresAt) {
      return { isValid: false, error: "Registration key has expired" };
    }

    return { isValid: true };
  } catch (error) {
    console.error("Error verifying registration key:", error);
    return { isValid: false, error: "Verification failed" };
  }
}
