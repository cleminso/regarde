import { co, z } from "jazz-tools";
import { ListOfPaymentEvents } from "./paymentEvent";
import { App } from "./regardeUserApp";
import { UserHandle } from "./regardeUserHandle";
import { RegardeAuth } from "./regardeAuth";

/**
 * Container schema for all Regarde SDK components
 *
 * - userHandle - User's profile and nickname data
 *
 * - auth - Authentication token for API requests
 *
 * - payments - Payment manager for subscriptions and transactions
 *
 * - version - Schema version for migration tracking
 */
export const RegardeSDK = co.map({
  auth: RegardeAuth,
  myApps: co.list(App),
  myPayments: co.map({
    all: ListOfPaymentEvents,
    byApp: co.record(z.string(), ListOfPaymentEvents),
  }),
  myUserHandle: UserHandle,
  version: z.number(),
});
