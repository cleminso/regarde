import { createRoute } from "@hono/zod-openapi";
import {
  UserDetailsRequestSchema,
  UserDetailsResponseSchema,
} from "../schemas/userDetails";
import { ErrorResponseSchema } from "../schemas/common";
import { OnboardingAccount } from "../schemas/profile";

export const userDetailsRoute = createRoute({
  method: "get",
  path: "/users/{jazzAccountId}",
  request: {
    params: UserDetailsRequestSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UserDetailsResponseSchema,
        },
      },
      description: "User details retrieved successfully",
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "User not found",
    },
    429: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Too many requests - rate limit exceeded",
    },
    500: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Internal server error",
    },
  },
  tags: ["User Management"],
  summary: "Get user public details",
  description:
    "Retrieve public information about a user by their Jazz Account ID, including their nickname and public profile data",
});

export const userDetailsHandler = (reverseNicknameRegistry: any) => {
  return async (c: any) => {
    let jazzAccountId: string;
    
    try {
      // Safely extract and validate parameters
      try {
        const params = c.req.valid("param");
        jazzAccountId = params?.jazzAccountId;
        
        if (!jazzAccountId || typeof jazzAccountId !== 'string' || jazzAccountId.trim() === '') {
          console.warn(`Invalid jazzAccountId provided: ${jazzAccountId}`);
          return c.json({ 
            error: "Invalid or missing jazzAccountId parameter" 
          }, 400);
        }
        
        jazzAccountId = jazzAccountId.trim();
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
            publicData: Object.keys(publicData).length > 0 ? publicData : undefined,
            exists: true,
          }, 200);
        } else {
          // Account doesn't exist or couldn't be loaded
          return c.json({
            ...baseResponse,
            exists: !!nickname, // If they have a nickname, they probably exist
          }, 200);
        }
      } catch (responseError) {
        console.error(`Error building response for ${jazzAccountId}: ${responseError}`);
        
        // Fallback minimal response
        return c.json({
          jazzAccountId,
          nickname: nickname || undefined,
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
