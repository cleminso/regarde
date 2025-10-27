import { RegardeAuth } from "@regarde-dev/jazz-schemas/regarde.dev";

export interface VerificationResult {
  isValid: boolean;
  error?: string;
}

export async function verifyRegardeAuth(
  jazzAccountId: string,
  providedRegardeAuth: string,
  regardeAuthCoValueId: string,
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

      await regardeAuth?.$jazz.ensureLoaded({
        resolve: true,
      });

      if (regardeAuth?.$jazz.owner.getRoleOf(jazzAccountId) !== "admin")
        // TODO: Important! Must check who created the coValue instead of whether it's an admin or not
        throw new Error("User does not own the CoValue");
    } catch (loadError: any) {
      console.error(`Failed to load account ${jazzAccountId}:`, loadError);
      return {
        isValid: false,
        error: "regardeAuth does not exist or is not accessible",
      };
    }

    if (!regardeAuth) {
      console.log(`No registration token found`);
      return {
        isValid: false,
        error:
          "No registration token found - user must create registration token first",
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

