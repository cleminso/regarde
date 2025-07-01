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

    console.log(`Attempting to load account: ${jazzAccountId}`);

    let account;
    try {
      account = await OnboardingAccount.load(jazzAccountId, {
        loadAs: worker,
      });
    } catch (basicLoadError: any) {
      console.error(`Failed to load account ${jazzAccountId}:`, basicLoadError);
      return { isValid: false, error: "Account not found or not accessible" };
    }

    if (!account) {
      console.log(
        `Account ${jazzAccountId} returned null - not found or not accessible`,
      );
      return { isValid: false, error: "Account not found or not accessible" };
    }

    console.log(`Account loaded successfully. Checking root...`);
    console.log(`Account has root:`, !!account.root);

    if (!account.root) {
      console.log(
        `Account ${jazzAccountId} has no root field - account not properly initialized`,
      );
      return {
        isValid: false,
        error:
          "Account not properly initialized - user must sign in to profile app first",
      };
    }

    console.log(`Account has root, attempting deep resolution...`);
    try {
      account = await OnboardingAccount.load(jazzAccountId, {
        resolve: {
          root: {
            registrationKey: true,
          },
        },
        loadAs: worker,
      });

      if (!account) {
        return {
          isValid: false,
          error: "Failed to load account with resolution",
        };
      }
    } catch (deepLoadError: any) {
      console.error(`Failed to load account with resolution:`, deepLoadError);
      return { isValid: false, error: "Failed to resolve account data" };
    }

    console.log(`Account loaded with resolution, checking registration key...`);

    const storedKeyData = account.root?.registrationKey;
    if (!storedKeyData) {
      console.log(`No registration key found in account root`);
      return {
        isValid: false,
        error:
          "No registration key found - user must create registration key first",
      };
    }

    console.log(`Registration key found, verifying...`);

    if (storedKeyData.key !== providedKey) {
      return { isValid: false, error: "Invalid registration key" };
    }

    if (storedKeyData.expiresAt && Date.now() > storedKeyData.expiresAt) {
      return { isValid: false, error: "Registration key has expired" };
    }

    console.log(
      `Registration key verified successfully for account: ${jazzAccountId}`,
    );
    return { isValid: true };
  } catch (error: any) {
    console.error("Error verifying registration key:", error);
    return { isValid: false, error: `Verification failed: ${error.message}` };
  }
}
