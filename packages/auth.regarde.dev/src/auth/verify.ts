import { RegistrationKey } from "@regarde-dev/shared-schemas";

export interface VerificationResult {
  isValid: boolean;
  error?: string;
}

export async function verifyRegistrationKey(
  jazzAccountId: string,
  providedRegistrationKey: string,
  registrationKeyCoValueId: string,
  worker: any,
): Promise<VerificationResult> {
  try {
    if (!jazzAccountId || !providedRegistrationKey) {
      return { isValid: false, error: "Missing jazzAccountId or key" };
    }

    console.log(
      `Attempting to load account: ${jazzAccountId} with registrationKeyCoValueId ${registrationKeyCoValueId}`,
    );

    let registrationKey = null;

    try {
      registrationKey = await RegistrationKey.load(registrationKeyCoValueId, {
        resolve: true,
      });

      await registrationKey?.$jazz.ensureLoaded({
        resolve: true,
      });

      if (registrationKey?.$jazz.owner.getRoleOf(jazzAccountId) !== "admin")
        // TODO: Important! Must check who created the coValue instead of whether it's an admin or not
        throw new Error("User does not own the CoValue");
    } catch (loadError: any) {
      console.error(`Failed to load account ${jazzAccountId}:`, loadError);
      return {
        isValid: false,
        error: "RegistrationKey does not exist or is not accessible",
      };
    }

    if (!registrationKey) {
      console.log(`No registration key found`);
      return {
        isValid: false,
        error:
          "No registration key found - user must create registration key first",
      };
    }

    console.log(
      `Registration key found, verifying: ${registrationKey.key} - ${registrationKey.expiresAt}`,
    );

    if (registrationKey.key !== providedRegistrationKey) {
      return { isValid: false, error: "Invalid registration key" };
    }

    if (registrationKey.expiresAt && Date.now() > registrationKey.expiresAt) {
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
