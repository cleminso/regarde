import { createHmac, timingSafeEqual } from "node:crypto";

import { RegardeError, REGARDE_ERROR_CODES } from "#core/errors";

/**
 * Result of webhook verification.
 */
export interface TVerifyWebhookResult {
  isValid: boolean;
  error?: string;
  payload?: unknown;
}

/**
 * Verifies a Stripe webhook signature.
 *
 * Uses Stripe's signature verification algorithm:
 * 1. Extract timestamp and signature from header
 * 2. Compute HMAC-SHA256 of timestamp.body with webhook secret
 * 3. Compare computed signature with provided signature using timing-safe comparison
 *
 * @param payload - Raw request body (string)
 * @param signature - Stripe-Signature header value
 * @param secret - Webhook signing secret (whsec_...)
 * @param tolerance - Time tolerance in seconds (default: 300 = 5 minutes)
 * @returns Verification result
 */
export function verifyStripeWebhook(
  payload: string,
  signature: string,
  secret: string,
  tolerance: number = 300,
): TVerifyWebhookResult {
  try {
    // Parse the signature header
    // Format: t=<timestamp>,v1=<signature>
    const elements = signature.split(",");
    const signatureMap = new Map<string, string>();

    for (const element of elements) {
      const [key, value] = element.split("=");
      if (key !== undefined && value !== undefined) {
        signatureMap.set(key.trim(), value.trim());
      }
    }

    const timestamp = signatureMap.get("t");
    const signedPayload = signatureMap.get("v1");

    if (timestamp === undefined || signedPayload === undefined) {
      return {
        isValid: false,
        error: "Invalid signature format: missing timestamp or signature",
      };
    }

    // Check timestamp tolerance
    const now = Math.floor(Date.now() / 1000);
    const eventTime = Number.parseInt(timestamp, 10);
    const isTimestampValid = Number.isNaN(eventTime) === false && now - eventTime <= tolerance;

    if (isTimestampValid === false) {
      return {
        isValid: false,
        error: `Timestamp too old: ${eventTime}, now: ${now}, tolerance: ${tolerance}s`,
      };
    }

    // Compute expected signature
    // Format: timestamp.payload
    const signedContent = `${timestamp}.${payload}`;
    const expectedSignature = createHmac("sha256", secret).update(signedContent).digest("hex");

    // Timing-safe comparison
    const providedBuffer = Buffer.from(signedPayload, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (providedBuffer.length !== expectedBuffer.length) {
      return {
        isValid: false,
        error: "Signature length mismatch",
      };
    }

    const isSignatureValid = timingSafeEqual(providedBuffer, expectedBuffer);

    if (isSignatureValid === false) {
      return {
        isValid: false,
        error: "Signature mismatch",
      };
    }

    // Parse payload
    let parsedPayload: unknown;
    try {
      parsedPayload = JSON.parse(payload);
    } catch {
      return {
        isValid: true,
        error: "Signature valid but payload is not valid JSON",
      };
    }

    return {
      isValid: true,
      payload: parsedPayload,
    };
  } catch (error) {
    throw new RegardeError(
      error instanceof Error ? error.message : "Webhook verification failed",
      REGARDE_ERROR_CODES.PROVIDER_API_ERROR,
      "stripe",
      error,
    );
  }
}

/**
 * Verifies a Polar webhook signature.
 *
 * Polar uses a simple HMAC-SHA256 signature:
 * 1. Compute HMAC-SHA256 of raw payload with webhook secret
 * 2. Compare with signature header using timing-safe comparison
 *
 * @param payload - Raw request body (string)
 * @param signature - X-Polar-Signature header value
 * @param secret - Webhook signing secret
 * @returns Verification result
 */
export function verifyPolarWebhook(
  payload: string,
  signature: string,
  secret: string,
): TVerifyWebhookResult {
  try {
    // Compute expected signature
    const expectedSignature = createHmac("sha256", secret).update(payload).digest("hex");

    // Timing-safe comparison
    const providedBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (providedBuffer.length !== expectedBuffer.length) {
      return {
        isValid: false,
        error: "Signature length mismatch",
      };
    }

    const isSignatureValid = timingSafeEqual(providedBuffer, expectedBuffer);

    if (isSignatureValid === false) {
      return {
        isValid: false,
        error: "Signature mismatch",
      };
    }

    // Parse payload
    let parsedPayload: unknown;
    try {
      parsedPayload = JSON.parse(payload);
    } catch {
      return {
        isValid: true,
        error: "Signature valid but payload is not valid JSON",
      };
    }

    return {
      isValid: true,
      payload: parsedPayload,
    };
  } catch (error) {
    throw new RegardeError(
      error instanceof Error ? error.message : "Webhook verification failed",
      REGARDE_ERROR_CODES.PROVIDER_API_ERROR,
      "polar",
      error,
    );
  }
}

/**
 * Generic webhook verification function.
 *
 * Detects provider from payload or uses explicit provider parameter.
 *
 * @param payload - Raw request body
 * @param signature - Signature header value
 * @param secret - Webhook signing secret
 * @param provider - Explicit provider type (auto-detect if not provided)
 * @returns Verification result
 */
export function verifyWebhook(
  payload: string,
  signature: string,
  secret: string,
  provider?: "stripe" | "polar",
): TVerifyWebhookResult {
  // Auto-detect provider from payload if not specified
  let detectedProvider: "stripe" | "polar" | undefined = provider;

  if (detectedProvider === undefined) {
    try {
      const parsed = JSON.parse(payload) as { object?: string; data?: { object?: string } };
      // Stripe payloads have 'object' field at root or in data.object
      const hasStripeStructure =
        parsed.object !== undefined ||
        (parsed.data !== undefined && parsed.data.object !== undefined);

      if (hasStripeStructure === true) {
        detectedProvider = "stripe";
      } else {
        // Assume Polar if not Stripe
        detectedProvider = "polar";
      }
    } catch {
      // Cannot parse, default to Stripe format
      detectedProvider = "stripe";
    }
  }

  switch (detectedProvider) {
    case "stripe":
      return verifyStripeWebhook(payload, signature, secret);
    case "polar":
      return verifyPolarWebhook(payload, signature, secret);
    default:
      return {
        isValid: false,
        error: "Unknown provider",
      };
  }
}
