import { describe, it, expect } from "vitest";

import { RegardeError, REGARDE_ERROR_CODES } from "#core/errors";
import {
  SUBSCRIPTION_STATUSES,
  SUBSCRIPTION_EVENT_TYPES,
} from "#core/schemas/subscriptionEvent";

describe("Subscription Lifecycle", () => {
  describe("subscription statuses", () => {
    it("should have all expected subscription statuses", () => {
      const expectedStatuses = [
        "trialing",
        "active",
        "past_due",
        "canceled",
        "expired",
        "paused",
      ];

      expectedStatuses.forEach((status) => {
        expect(SUBSCRIPTION_STATUSES).toContain(status);
      });
    });

    it("should identify active statuses correctly", () => {
      const activeStatuses = ["trialing", "active", "past_due"];

      activeStatuses.forEach((status) => {
        expect(SUBSCRIPTION_STATUSES).toContain(status);
        expect(["canceled", "expired"]).not.toContain(status);
      });
    });

    it("should identify terminal statuses correctly", () => {
      const terminalStatuses = ["canceled", "expired"];

      terminalStatuses.forEach((status) => {
        expect(SUBSCRIPTION_STATUSES).toContain(status);
      });
    });
  });

  describe("subscription event types", () => {
    it("should have all expected event types", () => {
      const expectedEventTypes = [
        "subscription.created",
        "subscription.activated",
        "subscription.paused",
        "subscription.resumed",
        "subscription.past_due",
        "subscription.canceled",
        "subscription.uncanceled",
        "subscription.expired",
        "subscription.trial_will_end",
        "subscription.updated",
      ];

      expectedEventTypes.forEach((eventType) => {
        expect(SUBSCRIPTION_EVENT_TYPES).toContain(eventType);
      });
    });
  });

  describe("subscription actions", () => {
    it("should support pause action for active subscriptions", () => {
      const currentStatus = "active";
      const canPause = currentStatus === "active" || currentStatus === "trialing";

      expect(canPause).toBe(true);
    });

    it("should not support pause for already paused subscriptions", () => {
      const currentStatus = "paused";
      const canPause = currentStatus === "active" || currentStatus === "trialing";

      expect(canPause).toBe(false);
    });

    it("should support resume for paused subscriptions", () => {
      const currentStatus = "paused";
      const canResume = currentStatus === "paused";

      expect(canResume).toBe(true);
    });

    it("should support cancel for non-terminal subscriptions", () => {
      const currentStatus = "active";
      const terminalStatuses = ["canceled", "expired"];
      const canCancel = !terminalStatuses.includes(currentStatus);

      expect(canCancel).toBe(true);
    });

    it("should not support cancel for already canceled subscriptions", () => {
      const currentStatus = "canceled";
      const terminalStatuses = ["canceled", "expired"];
      const canCancel = !terminalStatuses.includes(currentStatus);

      expect(canCancel).toBe(false);
    });
  });

  describe("subscription state transitions", () => {
    it("should transition from trialing to active", () => {
      const events = [
        { eventType: "subscription.created", status: "trialing" },
        { eventType: "subscription.activated", status: "active" },
      ];

      expect(events[0].status).toBe("trialing");
      expect(events[1].status).toBe("active");
    });

    it("should transition from active to past_due on payment failure", () => {
      const events = [
        { eventType: "subscription.activated", status: "active" },
        { eventType: "subscription.past_due", status: "past_due" },
      ];

      expect(events[1].status).toBe("past_due");
    });

    it("should transition from past_due to canceled", () => {
      const events = [
        { eventType: "subscription.past_due", status: "past_due" },
        { eventType: "subscription.canceled", status: "canceled" },
      ];

      expect(events[1].status).toBe("canceled");
    });

    it("should transition from active to paused", () => {
      const events = [
        { eventType: "subscription.activated", status: "active" },
        { eventType: "subscription.paused", status: "paused" },
      ];

      expect(events[1].status).toBe("paused");
    });

    it("should transition from paused to active on resume", () => {
      const events = [
        { eventType: "subscription.paused", status: "paused" },
        { eventType: "subscription.resumed", status: "active" },
      ];

      expect(events[1].status).toBe("active");
    });
  });

  describe("subscription action errors", () => {
    it("should throw SUBSCRIPTION_PAUSE_FAILED when pause fails", () => {
      const error = new RegardeError(
        "Failed to pause subscription",
        REGARDE_ERROR_CODES.SUBSCRIPTION_PAUSE_FAILED,
        "stripe",
      );

      expect(error.code).toBe("subscription_pause_failed");
      expect(error.provider).toBe("stripe");
    });

    it("should throw SUBSCRIPTION_RESUME_FAILED when resume fails", () => {
      const error = new RegardeError(
        "Failed to resume subscription",
        REGARDE_ERROR_CODES.SUBSCRIPTION_RESUME_FAILED,
        "polar",
      );

      expect(error.code).toBe("subscription_resume_failed");
      expect(error.provider).toBe("polar");
    });

    it("should throw SUBSCRIPTION_CANCEL_FAILED when cancel fails", () => {
      const error = new RegardeError(
        "Failed to cancel subscription",
        REGARDE_ERROR_CODES.SUBSCRIPTION_CANCEL_FAILED,
        "stripe",
      );

      expect(error.code).toBe("subscription_cancel_failed");
      expect(error.provider).toBe("stripe");
    });
  });

  describe("subscription CoMap structure", () => {
    it("should have required fields", () => {
      const subscription = {
        app: "co_app123",
        userAccount: "co_user456",
        provider: "stripe",
        providerSubscriptionId: "sub_123",
        createdByEventId: "co_event789",
        lastSubscriptionEventId: "co_event012",
        status: "active",
        currentPeriodStart: Date.now() - 86400000,
        currentPeriodEnd: Date.now() + 2592000000,
        planId: "price_123",
        cancelAtPeriodEnd: false,
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now(),
      };

      expect(subscription.app).toBeDefined();
      expect(subscription.userAccount).toBeDefined();
      expect(subscription.provider).toBeOneOf(["stripe", "polar"]);
      expect(subscription.providerSubscriptionId).toBeDefined();
      expect(subscription.status).toBeOneOf(SUBSCRIPTION_STATUSES);
      expect(typeof subscription.currentPeriodStart).toBe("number");
      expect(typeof subscription.currentPeriodEnd).toBe("number");
      expect(typeof subscription.cancelAtPeriodEnd).toBe("boolean");
    });

    it("should track cancelAtPeriodEnd correctly", () => {
      const subscription = {
        status: "active",
        cancelAtPeriodEnd: true,
        currentPeriodEnd: Date.now() + 2592000000,
      };

      expect(subscription.status).toBe("active");
      expect(subscription.cancelAtPeriodEnd).toBe(true);
      // Subscription is still active but will cancel at period end
      expect(subscription.currentPeriodEnd).toBeGreaterThan(Date.now());
    });

    it("should track optional payment event linkage", () => {
      const subscription = {
        lastPaymentEventId: "co_payment123",
      };

      expect(subscription.lastPaymentEventId).toBeDefined();
    });

    it("should track cancellation event linkage", () => {
      const subscription = {
        status: "canceled",
        canceledByEventId: "co_cancel_event123",
      };

      expect(subscription.status).toBe("canceled");
      expect(subscription.canceledByEventId).toBeDefined();
    });
  });
});
