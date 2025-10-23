const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = (maxRequests: number, windowMs: number) => {
  return async (c: any, next: any) => {
    const ip =
      c.req.header("x-forwarded-for") ||
      c.req.header("x-real-ip") ||
      c.req.header("cf-connecting-ip") ||
      "unknown";
    const now = Date.now();

    const record = rateLimitMap.get(ip);

    if (!record || now > record.resetTime) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
      await next();
      return;
    }

    if (record.count >= maxRequests) {
      console.log(`Rate limit exceeded for IP: ${ip}`);
      return c.json({ error: "Too many requests" }, 429);
    }

    record.count++;
    await next();
  };
};
