import type { TPaymentProvider } from "@regarde-dev/core";

export interface WebhookWithDetails {
  name: string;
  description: string;
  provider: TPaymentProvider;
  environment: "sandbox" | "production";
  url: string;
  secret: string;
  isEnabled: boolean;
  createdAt: number;
  deliveryCount: number;
  lastDeliveryAt?: number;
}

export interface DeliveryFilters {
  status: "all" | "success" | "retry" | "error";
  httpResponse: "all" | "200" | "400" | "500";
  eventType: "all" | string;
  environment: "all" | "production" | "sandbox";
}

export interface WebhookFormData {
  name: string;
  description: string;
  provider: TPaymentProvider;
  environment: "sandbox" | "production";
  secret: string;
}
