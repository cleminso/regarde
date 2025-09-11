import { createRoute } from "@hono/zod-openapi";
import {
  UserDetailsRequestSchema,
  UserDetailsResponseSchema,
} from "../schemas/userDetails.js";
import { ErrorResponseSchema } from "../schemas/common.js";

import {
  JazzAppProfile,
  OnboardingAccount,
} from "@onboarding.jazz/shared-schemas/profile";
import { Loaded } from "jazz-tools";

export const userDetailsRoute = createRoute({
  method: "get",
  path: "/users",
  request: {
    query: UserDetailsRequestSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UserDetailsResponseSchema,
        },
      },
      description:
        "User details retrieved successfully - returns complete user profile information including nickname status and public data",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description:
        "Bad request - missing required parameters, invalid parameter format, or nickname/account ID mismatch when both provided",
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description:
        "Not found - specified nickname does not exist in the registry or cannot be resolved to an account",
    },
    429: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description:
        "Too many requests - rate limit exceeded, please wait before making additional requests",
    },
    500: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description:
        "Internal server error - unexpected server failure during account loading or registry access",
    },
  },
  tags: ["User Management"],
  summary: "Get user public details by Jazz Account ID or nickname",
  description: `
    Flexible endpoint for retrieving public user information. Supports multiple query patterns based on available identifiers:

    **1. Fetch by Jazz Account ID only:**
    - Query: ?jazzAccountId=account123
    - Use case: When you have the account ID and want to get profile info + nickname
    - Example: GET /users?jazzAccountId=co_zdpuB2Ww8jKvjq7Kp9M4N5o6P7q8R9s0T

    **2. Fetch by nickname only:**
    - Query: ?nickname=john_doe
    - Use case: Profile page URLs, user search by handle
    - Resolves nickname to account ID internally
    - Example: GET /users?nickname=john_doe

    **3. Fetch with both (validation mode):**
    - Query: ?jazzAccountId=account123&nickname=john_doe
    - Use case: Verify nickname ownership, prevent impersonation
    - Returns error if nickname is not owned by the specified account
    - Example: GET /users?jazzAccountId=co_zdpuB2Ww8jKvjq7Kp9M4N5o6P7q8R9s0T&nickname=john_doe

    **Query Parameters:**
    - jazzAccountId (optional): The Jazz Account ID to look up
    - nickname (optional): The registered nickname to resolve
    - At least one parameter is required

    **Response Fields:**
    - jazzAccountId: The resolved Jazz Account ID
    - nickname: Current registered nickname (if any)
    - requestedNickname: The nickname used in the request (for transparency)
    - exists: Whether the user account exists and has data
    - nicknameStatus: Detailed nickname registration information
    - publicData: Available profile information (name, bio, projects, etc.)

    **Validation Rules:**
    - At least one of jazzAccountId or nickname must be provided
    - If both provided, nickname must be owned by the specified account
    - Nickname resolution uses the live nickname registry
    - Non-existent nicknames return 404 error
  `,
});

export const userDetailsHandler = (
  reverseNicknameRegistry: any,
  nicknameRegistry: any,
) => {
  return async (c: any) => {
    // Variable to hold the Jazz Account ID once it's successfully resolved for the main logic.
    // It will be a string if parameter processing is successful.
    let processedJazzAccountId: string | undefined;
    // Store the originally requested nickname from the query for inclusion in responses.
    let requestedNicknameFromQuery: string | undefined;

    try {
      // Inner try-catch specifically for parameter validation and initial ID resolution.
      // This helps isolate errors from this stage.
      try {
        const query = c.req.valid("query"); // This can throw if Zod validation fails.
        const queryJazzAccountId = query?.jazzAccountId?.trim();
        const queryNickname = query?.nickname?.trim();

        requestedNicknameFromQuery = queryNickname; // Store for consistent response.

        if (!queryJazzAccountId && !queryNickname) {
          console.warn(`Neither jazzAccountId nor nickname provided`);
          return c.json(
            { error: "Either jazzAccountId or nickname parameter is required" },
            400,
          );
        }

        if (queryNickname) {
          let accountIdFromNickname: string | undefined;
          try {
            if (
              nicknameRegistry &&
              typeof nicknameRegistry === "object" &&
              nicknameRegistry[queryNickname]
            ) {
              accountIdFromNickname = nicknameRegistry[queryNickname];
            }
          } catch (registryError: any) {
            console.error(
              `Error accessing nickname registry for nickname "${queryNickname}": ${registryError.message || registryError}`,
            );
            // This is a server-side issue if the registry is expected to be valid.
            return c.json(
              { error: "Internal server error during nickname lookup" },
              500,
            );
          }

          if (!accountIdFromNickname) {
            return c.json({ error: "Nickname not found" }, 404);
          }

          // If both jazzAccountId and nickname were provided, they must match.
          if (
            queryJazzAccountId &&
            queryJazzAccountId !== accountIdFromNickname
          ) {
            return c.json(
              {
                error:
                  "Provided nickname is not owned by the provided jazzAccountId",
              },
              400,
            );
          }
          processedJazzAccountId = accountIdFromNickname; // ID is resolved from nickname.
        } else if (queryJazzAccountId) {
          // Only jazzAccountId was provided (and no nickname).
          processedJazzAccountId = queryJazzAccountId; // ID is from the query.
        } else {
          // This state should ideally be caught by the first check, but as a fallback.
          console.error(
            "Logical error: Reached unexpected state in parameter validation.",
          );
          return c.json(
            {
              error: "Unable to resolve user account due to missing parameters",
            },
            400,
          );
        }
      } catch (paramError: any) {
        // Catches errors from c.req.valid("query") or other synchronous errors in the block above.
        console.error(
          `Parameter validation or extraction failed: ${paramError.message || paramError}`,
        );
        // For error reporting, try to get original query params as processedJazzAccountId might not be set.
        const originalReqJazzId = c.req.query("jazzAccountId");
        const originalReqNickname = c.req.query("nickname");
        return c.json(
          {
            error: "Invalid request parameters",
            details: `Input: jazzAccountId='${originalReqJazzId || ""}', nickname='${originalReqNickname || ""}'`,
          },
          400,
        );
      }

      // If we proceed beyond the inner try-catch, processedJazzAccountId should be a string.
      // Add a strict check for safety; if not, it's an unhandled logic path in param processing.
      if (
        typeof processedJazzAccountId !== "string" ||
        !processedJazzAccountId
      ) {
        console.error(
          "Critical internal error: processedJazzAccountId is not a valid string after parameter block.",
        );
        return c.json(
          { error: "Internal server error determining account ID" },
          500,
        );
      }

      // Main application logic now uses processedJazzAccountId (guaranteed to be a string here).
      console.log(
        `Looking up user details for Jazz Account ID: "${processedJazzAccountId}"`,
      );

      let currentNicknameInRegistry: string | undefined;
      try {
        if (
          reverseNicknameRegistry &&
          typeof reverseNicknameRegistry === "object"
        ) {
          currentNicknameInRegistry =
            reverseNicknameRegistry[processedJazzAccountId];
        } else {
          console.warn("ReverseNicknameRegistry is not available or invalid");
        }
      } catch (registryError: any) {
        console.error(
          `Error accessing reverse nickname registry for ${processedJazzAccountId}: ${registryError.message || registryError}`,
        );
        // Depending on policy, might return 500 or proceed without reverse lookup.
      }

      const hasNickname = Boolean(currentNicknameInRegistry);
      const nicknameStatus = {
        hasNickname,
        isRegistered: hasNickname,
        registrationDate: undefined, // Not tracked in current implementation
        canRegisterNickname: !hasNickname,
      };

      let accountLoadError: string | null = null;
      let profileData: Loaded<typeof JazzAppProfile> | null = null;

      try {
        const jazzUserAccount = await OnboardingAccount.load(
          processedJazzAccountId,
          {
            resolve: {
              profile: {
                "regarde.dev": true,
              },
            },
          },
        );
        jazzUserAccount?.$jazz.ensureLoaded({
          resolve: {
            profile: true,
          },
        });

        if (!jazzUserAccount) throw new Error("Profile not found");

        const jazzAppProfileId = jazzUserAccount.profile["regarde.dev"];

        console.log("JazzAppProfileID:", jazzAppProfileId);

        if (!jazzAppProfileId) throw new Error("JazzAppProfileID not found");

        profileData = await JazzAppProfile.load(jazzAppProfileId, {
          resolve: {
            projects: { $each: true },
            socialLinks: true,
            workExp: { $each: true },
            writing: { $each: true },
            education: { $each: true },
            certification: { $each: true },
            speaking: { $each: true },
            award: { $each: true },
            volunteering: { $each: true },
            sideProject: { $each: true },
            nowPage: true,
            avatarImage: { original: true },
          },
        });
        profileData?.$jazz.ensureLoaded({
          resolve: {
            projects: { $each: true },
            socialLinks: true,
            workExp: { $each: true },
            writing: { $each: true },
            education: { $each: true },
            certification: { $each: true },
            speaking: { $each: true },
            award: { $each: true },
            volunteering: { $each: true },
            sideProject: { $each: true },
            nowPage: true,
            avatarImage: { original: true },
          },
        });
      } catch (accountError: any) {
        accountLoadError =
          accountError?.message || "Unknown account loading error";
        console.warn(
          `Account ${processedJazzAccountId} could not be loaded: ${accountLoadError}`,
        );
        // Account remains null
      }

      // Build the response
      try {
        const baseResponse = {
          jazzAccountId: processedJazzAccountId, // Known to be a string here
          nickname: currentNicknameInRegistry || undefined,
          nicknameStatus,
        };

        if (profileData) {
          const publicData: Record<string, any> = {};
          try {
            // Safely extract profile data
            if (profileData) {
              Object.assign(publicData, profileData);

              // Extract avatar image URL for public access
              if (profileData.avatarImage?.original) {
                try {
                  const blob = profileData.avatarImage.original.toBlob();
                  if (blob) {
                    const arrayBuffer = await blob.arrayBuffer();
                    const base64 = Buffer.from(arrayBuffer).toString("base64");
                    const mimeType = blob.type || "image/jpeg";
                    publicData.avatarImage = `data:${mimeType};base64,${base64}`;
                  } else {
                    delete publicData.avatarImage;
                  }
                } catch (imageError) {
                  console.warn(`Error processing avatar image: ${imageError}`);
                  delete publicData.avatarImage;
                }
              } else {
                // Remove the ImageDefinition object if no original is available
                delete publicData.avatarImage;
              }
            }
          } catch (profileError: any) {
            console.warn(
              `Error extracting profile data for ${processedJazzAccountId}: ${profileError.message || profileError}`,
            );
          }

          return c.json(
            {
              ...baseResponse,
              requestedNickname: requestedNicknameFromQuery || undefined,
              publicData:
                Object.keys(profileData).length > 0 ? publicData : undefined,
              exists: true,
            },
            200,
          );
        } else {
          // Account doesn't exist or couldn't be loaded, or has no profile
          return c.json(
            {
              ...baseResponse,
              requestedNickname: requestedNicknameFromQuery || undefined,
              exists: !!currentNicknameInRegistry, // If they have/had a nickname, the "user" entry might be considered to exist.
            },
            200,
          );
        }
      } catch (responseError: any) {
        console.error(
          `Error building response for ${processedJazzAccountId}: ${responseError.message || responseError}`,
        );
        // Fallback response if building the main response fails
        return c.json(
          {
            jazzAccountId: processedJazzAccountId, // Still a string here
            nickname: currentNicknameInRegistry || undefined,
            requestedNickname: requestedNicknameFromQuery || undefined,
            exists: !!currentNicknameInRegistry,
            nicknameStatus, // Use the already computed nicknameStatus
          },
          200,
        ); // Or 500 if this is a server error
      }
    } catch (outerError: any) {
      // Final catch-all for unexpected errors
      console.error(
        `Critical error in userDetailsHandler: ${outerError.message || outerError}`,
      );
      console.error(`Stack trace: ${outerError?.stack}`);

      // In this outermost catch, processedJazzAccountId *might* be undefined if an error
      // occurred very early (e.g., if Hono middleware threw before c.req.valid,
      // or some other unexpected error before parameter processing block completed).
      // So, we provide robust fallbacks for the ID used in the error message.
      const accountIdForErrorMsg =
        processedJazzAccountId ??
        c.req.query("jazzAccountId") ??
        c.req.query("nickname") ??
        "unknown";

      return c.json(
        {
          error: "Internal server error",
          jazzAccountId: accountIdForErrorMsg,
          exists: false,
        },
        500,
      );
    }
  };
};
