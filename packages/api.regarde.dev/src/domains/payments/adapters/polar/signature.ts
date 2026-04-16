import { createHmac, timingSafeEqual } from "node:crypto";

export const validatePolarSignature = (
  payload: string,
  signature: string,
  secret: string,
  timestamp?: string,
  id?: string,
): boolean => {
  const signingSecret = secret;
  const parts = signature.split(",");

  if (parts.length === 2) {
    const sig = parts[1];

    let signedPayload: string;
    if (id !== undefined && id !== "" && timestamp !== undefined && timestamp !== "") {
      signedPayload = `${id}.${timestamp}.${payload}`;
    } else if (timestamp !== undefined && timestamp !== "") {
      signedPayload = `${timestamp}.${payload}`;
    } else {
      signedPayload = payload;
    }

    const expected = createHmac("sha256", signingSecret).update(signedPayload).digest("base64");

    const sigBuffer = Buffer.from(sig, "base64");
    const expectedBuffer = Buffer.from(expected, "base64");
    if (sigBuffer.length !== expectedBuffer.length) {
      return false;
    }
    return timingSafeEqual(sigBuffer, expectedBuffer);
  }

  const expected = createHmac("sha256", signingSecret).update(payload).digest("base64");

  const sigBuffer = Buffer.from(signature, "base64");
  const expectedBuffer = Buffer.from(expected, "base64");
  if (sigBuffer.length !== expectedBuffer.length) {
    return false;
  }
  return timingSafeEqual(sigBuffer, expectedBuffer);
};
