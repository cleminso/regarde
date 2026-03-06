import { useMemo } from "react";

import type { TApp, TWebhook } from "@regarde-dev/core";

// Mock webhooks for UI development
const MOCK_WEBHOOKS: TWebhook[] = [
  {
    $jazz: { id: "wh_001" } as unknown as TWebhook["$jazz"],
    name: "Production Webhook",
    description: "Main production endpoint",
    provider: "lemonsqueezy",
    environment: "production",
    url: "https://api.regarde.dev/webhooks/wh_001",
    secret: "whsec_abc123xyz789",
    isEnabled: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
  } as TWebhook,
  {
    $jazz: { id: "wh_002" } as unknown as TWebhook["$jazz"],
    name: "Sandbox Testing",
    description: "Test environment webhook",
    provider: "stripe",
    environment: "sandbox",
    url: "https://api.regarde.dev/webhooks/wh_002",
    secret: "whsec_test_456",
    isEnabled: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
  } as TWebhook,
  {
    $jazz: { id: "wh_003" } as unknown as TWebhook["$jazz"],
    name: "Polar Integration",
    description: "Polar.sh payments",
    provider: "polar",
    environment: "production",
    url: "https://api.regarde.dev/webhooks/wh_003",
    secret: "polar_whs_secret789",
    isEnabled: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
  } as TWebhook,
];

export function useWebhooks(
  _app: TApp | null | undefined,
): {
  webhooks: TWebhook[];
  isLoading: boolean;
} {
  return useMemo(
    () => ({
      webhooks: MOCK_WEBHOOKS,
      isLoading: false,
    }),
    [],
  );
}
