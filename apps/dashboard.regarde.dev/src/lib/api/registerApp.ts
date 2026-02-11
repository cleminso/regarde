import type { TRegardeAuthLoaded } from "@regarde-dev/core";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export interface RegisterAppResponse {
  appId: string;
  webhookUrl: string;
  webhookSecret: string;
}

interface RegisterAppError {
  code: string;
  message: string;
  status: number;
}

export class RegisterAppApiError extends Error {
  code: string;
  status: number;

  constructor(error: RegisterAppError) {
    super(error.message);
    this.code = error.code;
    this.status = error.status;
    this.name = "RegisterAppApiError";
  }
}

/**
 * Register an app with the Regarde API.
 *
 * Sends the app ID to the registry API for webhook configuration.
 * Requires valid authentication token from RegardeTokenAuth.
 *
 * @param appId - The Jazz CoMap ID of the newly created app
 * @param auth - Loaded RegardeTokenAuth containing the authentication token
 * @param accountId - The Jazz account ID for verification
 * @returns Promise resolving to webhook configuration details
 * @throws {RegisterAppApiError} When API returns error response
 * @throws {Error} When authentication is invalid or network fails
 */
export async function registerApp(
  appId: string,
  auth: TRegardeAuthLoaded,
  accountId: string,
): Promise<RegisterAppResponse> {
  const isAuthLoaded = auth.$isLoaded === true;
  if (isAuthLoaded === false) {
    throw new Error("Authentication not loaded");
  }

  const isTokenValid = Date.now() <= auth.expiresAt;
  if (isTokenValid === false) {
    throw new Error("Authentication token expired. Please re-login.");
  }

  const payload = {
    appId,
    jazzAccountId: accountId,
  };

  const response = await fetch(`${API_BASE_URL}/register-app`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Regarde-Token": auth.token,
      "X-Regarde-Token-Id": auth.$jazz.id,
      "X-Jazz-Account-Id": accountId,
    },
    body: JSON.stringify(payload),
  });

  if (response.ok === false) {
    const errorText = await response.text();

    if (response.status === 401 || response.status === 403) {
      throw new RegisterAppApiError({
        code: "AUTH_FAILED",
        message: "Authentication failed. Please re-login.",
        status: response.status,
      });
    }

    if (response.status === 400) {
      throw new RegisterAppApiError({
        code: "INVALID_REQUEST",
        message: `Invalid request: ${errorText}`,
        status: response.status,
      });
    }

    if (response.status === 404) {
      throw new RegisterAppApiError({
        code: "API_NOT_FOUND",
        message: "API endpoint not found. Please check your configuration.",
        status: response.status,
      });
    }

    if (response.status >= 500) {
      throw new RegisterAppApiError({
        code: "SERVER_ERROR",
        message: `Server error (${response.status}). Please try again later.`,
        status: response.status,
      });
    }

    throw new RegisterAppApiError({
      code: "UNKNOWN_ERROR",
      message: `Request failed: ${errorText}`,
      status: response.status,
    });
  }

  const data: unknown = await response.json();

  const isValidResponse =
    data !== null &&
    typeof data === "object" &&
    "appId" in data &&
    "webhookUrl" in data &&
    "webhookSecret" in data &&
    typeof (data as Record<string, unknown>).appId === "string" &&
    typeof (data as Record<string, unknown>).webhookUrl === "string" &&
    typeof (data as Record<string, unknown>).webhookSecret === "string";

  if (isValidResponse === false) {
    throw new RegisterAppApiError({
      code: "INVALID_RESPONSE",
      message: "API returned invalid response format",
      status: 200,
    });
  }

  const responseData = data as RegisterAppResponse;
  return {
    appId: responseData.appId,
    webhookUrl: responseData.webhookUrl,
    webhookSecret: responseData.webhookSecret,
  };
}
