import { createRoute } from "@hono/zod-openapi";
import {
  UserDetailsRequestSchema,
  UserDetailsResponseSchema,
} from "../schemas/userDetails";
import { ErrorResponseSchema } from "../schemas/common";
import { OnboardingAccount } from "../schemas/profile";

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
      description: "User details retrieved successfully - returns complete user profile information including nickname status and public data",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Bad request - missing required parameters, invalid parameter format, or nickname/account ID mismatch when both provided",
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Not found - specified nickname does not exist in the registry or cannot be resolved to an account",
    },
    429: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Too many requests - rate limit exceeded, please wait before making additional requests",
    },
    500: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Internal server error - unexpected server failure during account loading or registry access",
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

export const userDetailsHandler = (reverseNicknameRegistry: any, nicknameRegistry: any) => {
  return async (c: any) => {
    let jazzAccountId: string | undefined;
    let requestedNickname: string | undefined;
    
    try {
      // Safely extract and validate query parameters
      try {
        const query = c.req.valid("query");
        jazzAccountId = query?.jazzAccountId;
        requestedNickname = query?.nickname;
        
        // Validate that at least one parameter is provided
        if ((!jazzAccountId || jazzAccountId.trim() === '') && (!requestedNickname || requestedNickname.trim() === '')) {
          console.warn(`Neither jazzAccountId nor nickname provided`);
          return c.json({ 
            error: "Either jazzAccountId or nickname parameter is required" 
          }, 400);
        }
        
        // Clean up parameters
        if (jazzAccountId) jazzAccountId = jazzAccountId.trim();
        if (requestedNickname) requestedNickname = requestedNickname.trim();
        
        // If nickname is provided, resolve it to jazzAccountId
        if (requestedNickname) {
          let resolvedAccountId: string | undefined;
          try {
            if (nicknameRegistry && typeof nicknameRegistry === 'object') {
              resolvedAccountId = nicknameRegistry[requestedNickname];
            }
          } catch (registryError) {
            console.error(`Error accessing nickname registry: ${registryError}`);
          }
          
          if (!resolvedAccountId) {
            return c.json({ 
              error: "Nickname not found" 
            }, 404);
          }
          
          // If both parameters provided, validate they match
          if (jazzAccountId && jazzAccountId !== resolvedAccountId) {
            return c.json({ 
              error: "Provided nickname is not owned by the provided jazzAccountId" 
            }, 400);
          }
          
          jazzAccountId = resolvedAccountId;
        }
        
        if (!jazzAccountId) {
          return c.json({ 
            error: "Unable to resolve user account" 
          }, 400);
        }
        
      } catch (paramError) {
        console.error(`Parameter validation failed: ${paramError}`);
        return c.json({ 
          error: "Invalid request parameters" 
        }, 400);
      }

      console.log(`Looking up user details for Jazz Account ID: "${jazzAccountId}"`);

      // Safely access nickname registry with null checks
      let nickname: string | undefined;
      try {
        if (reverseNicknameRegistry && typeof reverseNicknameRegistry === 'object') {
          nickname = reverseNicknameRegistry[jazzAccountId];
        } else {
          console.warn('ReverseNicknameRegistry is not available or invalid');
          nickname = undefined;
        }
      } catch (registryError) {
        console.error(`Error accessing nickname registry: ${registryError}`);
        nickname = undefined;
      }

      // Determine nickname registration status safely
      const hasNickname = Boolean(nickname);
      const isRegistered = hasNickname;
      const canRegisterNickname = !hasNickname;

      const nicknameStatus = {
        hasNickname,
        isRegistered,
        registrationDate: undefined, // Not tracked in current implementation
        canRegisterNickname,
      };

      // Attempt to load account with comprehensive error handling
      let account: any = null;
      let accountLoadError: string | null = null;
      
      try {
        // Add timeout and additional safety measures for account loading
        const loadPromise = OnboardingAccount.load(jazzAccountId, {
          resolve: {
            profile: {
              projects: {
                $each: true,
              },
              socialLinks: {
                $each: true,
              },
              workExp: {
                $each: true,
              },
            },
          },
        });

        // Set a reasonable timeout for account loading
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Account loading timeout')), 10000);
        });

        account = await Promise.race([loadPromise, timeoutPromise]);
      } catch (accountError: any) {
        accountLoadError = accountError?.message || 'Unknown account loading error';
        console.warn(`Account ${jazzAccountId} could not be loaded: ${accountLoadError}`);
        account = null;
      }

      // Build response safely
      try {
        const baseResponse = {
          jazzAccountId,
          nickname: nickname || undefined,
          nicknameStatus,
        };

        if (account && account.profile) {
          // Account exists and has profile data
          const publicData: Record<string, any> = {};
          
          try {
            // Safely extract profile data
            if (account.profile) {
              Object.assign(publicData, account.profile);
            }
          } catch (profileError) {
            console.warn(`Error extracting profile data for ${jazzAccountId}: ${profileError}`);
          }

          return c.json({
            ...baseResponse,
            requestedNickname: requestedNickname || undefined,
            publicData: Object.keys(publicData).length > 0 ? publicData : undefined,
            exists: true,
          }, 200);
        } else {
          // Account doesn't exist or couldn't be loaded
          return c.json({
            ...baseResponse,
            requestedNickname: requestedNickname || undefined,
            exists: !!nickname, // If they have a nickname, they probably exist
          }, 200);
        }
      } catch (responseError) {
        console.error(`Error building response for ${jazzAccountId}: ${responseError}`);
        
        // Fallback minimal response
        return c.json({
          jazzAccountId,
          nickname: nickname || undefined,
          requestedNickname: requestedNickname || undefined,
          exists: !!nickname,
          nicknameStatus: {
            hasNickname: !!nickname,
            isRegistered: !!nickname,
            registrationDate: undefined,
            canRegisterNickname: !nickname,
          },
        }, 200);
      }
    } catch (outerError: any) {
      // Final catch-all to prevent server crashes
      console.error(`Critical error in userDetailsHandler: ${outerError}`);
      console.error(`Stack trace: ${outerError?.stack}`);
      
      // Return a safe fallback response
      return c.json({ 
        error: "Internal server error",
        jazzAccountId: jazzAccountId || 'unknown',
        exists: false,
      }, 500);
    }
  };
};
