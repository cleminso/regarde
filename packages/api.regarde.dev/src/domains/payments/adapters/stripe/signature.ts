import { createHmac, timingSafeEqual } from "node:crypto";

const STRIPE_SIGNATURE_TOLERANCE_SECONDS = 300;

const parseStripeSignature = (header: string): { timestamp: string; signatures: string[] } => {
  const parts = header.split(",");
  let timestamp = "";
  const signatures: string[] = [];

  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key === "t") timestamp = value;
    if (key === "v1") signatures.push(value);
  }

  return { timestamp, signatures };
};

export const validateStripeSignature = (
  payload: string,
  signature: string,
  secret: string,
): boolean => {
  const { timestamp, signatures } = parseStripeSignature(signature);

  if (signatures.length === 0 || timestamp === "") {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  const timestampNum = parseInt(timestamp, 10);
  if (Math.abs(now - timestampNum) > STRIPE_SIGNATURE_TOLERANCE_SECONDS) {
    return false;
  }

  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = createHmac("sha256", secret).update(signedPayload).digest("hex");

  return signatures.some((sig) => {
    const sigBuffer = Buffer.from(sig, "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    if (sigBuffer.length !== expectedBuffer.length) {
      return false;
    }
    return timingSafeEqual(sigBuffer, expectedBuffer);
  });
};
