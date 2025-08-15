import {
  JazzAppProfile,
  JazzProfileRoot,
  OnboardingAccount,
} from "@onboarding.jazz/shared-schemas/profile";
import { Group } from "jazz-tools";

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

    let account = null;

    try {
      account = await OnboardingAccount.load(jazzAccountId, {
        resolve: {
          profile: {
            "profile.jazz.dev": true,
          },
        },
        loadAs: worker,
      });

      await account?.ensureLoaded({
        resolve: {
          profile: {
            "profile.jazz.dev": true,
          },
        },
      });
    } catch (loadError: any) {
      console.error(`Failed to load account ${jazzAccountId}:`, loadError);
      return { isValid: false, error: "Account not found or not accessible" };
    }

    if (!account) {
      console.log(
        `Account ${jazzAccountId} returned null - not found or not accessible`,
      );
      return { isValid: false, error: "Account not found or not accessible" };
    }

    console.log(`Account loaded successfully. Checking profile...`);

    if (!account.profile) {
      console.log(
        `Account ${jazzAccountId} has no profile field - account not properly initialized`,
      );
      return {
        isValid: false,
        error:
          "Account not properly initialized - user must sign in to profile app first",
      };
    }

    console.log(
      `Profile found, checking registration key...`,
      account.profile["profile.jazz.dev"],
    );

    const registrationKeyData = await JazzAppProfile.load(
      account.profile["profile.jazz.dev"],
      {
        resolve: {
          registrationKey: true,
        },
      },
    );

    registrationKeyData?.ensureLoaded({
      resolve: {
        registrationKey: true,
      },
    });

    const storedKeyData = registrationKeyData?.registrationKey;

    if (!storedKeyData) {
      console.log(`No registration key found in account profile`);
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
