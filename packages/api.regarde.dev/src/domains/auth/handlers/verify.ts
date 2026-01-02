import { RegardeAuth } from "@regarde-dev/sdk/auth";
import { co, Loaded } from "jazz-tools";
import { RegistryWorkerAccount } from "@regarde-dev/sdk/registry";

export interface VerificationResult {
  isValid: boolean;
  error?: string;
}

export async function verifyRegardeAuth(
  jazzAccountId: string,
  providedRegardeAuth: string,
  regardeAuthCoValueId: string,
  worker: Loaded<typeof RegistryWorkerAccount>,
): Promise<VerificationResult> {
  try {
    if (!jazzAccountId || !providedRegardeAuth) {
      return { isValid: false, error: "Missing jazzAccountId or key" };
    }

    console.log(
      `Attempting to load account: ${jazzAccountId} with regardeAuthCoValueId ${regardeAuthCoValueId}`,
    );

    let regardeAuth = null;

    try {
      regardeAuth = await RegardeAuth.load(regardeAuthCoValueId, {
        resolve: true,
      });

      // Check if loaded successfully
      if (!regardeAuth || !regardeAuth.$isLoaded) {
        console.log(`No registration token found or not loaded`);
        return {
          isValid: false,
          error:
            "No registration token found - user must create registration token first",
        };
      }

      // Load user account to verify permissions on RegardeAuth CoValue
      const userAccount = await co.account().load(jazzAccountId, {
        loadAs: worker,
      });

      const userAccountLoaded = userAccount.$isLoaded === true;
      if (userAccountLoaded === false) {
        throw new Error("User account not found");
      }

      // Verify user has admin permissions on RegardeAuth CoValue
      const userCanAdminRegardeAuth = userAccount.canAdmin(regardeAuth);
      if (userCanAdminRegardeAuth === false) {
        throw new Error("User does not own the CoValue");
      }
    } catch (loadError: any) {
      console.error(`Failed to load account ${jazzAccountId}:`, loadError);
      return {
        isValid: false,
        error: "regardeAuth does not exist or is not accessible",
      };
    }

    console.log(
      `Registration token found, verifying: ${regardeAuth.token} - ${regardeAuth.expiresAt}`,
    );

    if (regardeAuth.token !== providedRegardeAuth) {
      return { isValid: false, error: "Invalid registration token" };
    }

    if (regardeAuth.expiresAt && Date.now() > regardeAuth.expiresAt) {
      return { isValid: false, error: "Registration token has expired" };
    }

    console.log(
      `Registration token verified successfully for account: ${jazzAccountId}`,
    );
    return { isValid: true };
  } catch (error: any) {
    console.error("Error verifying registration token:", error);
    return { isValid: false, error: `Verification failed: ${error.message}` };
  }
}
