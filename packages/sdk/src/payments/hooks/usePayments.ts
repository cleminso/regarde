import { useAccount } from "jazz-tools/react";
import { co } from "jazz-tools";
import { MySubscription, PaymentEvent, MySubscriptionLoaded, PaymentEventLoaded, ListOfMySubscriptions, ListOfPaymentEvents } from "../schemas";
import { RegardeSDK } from "../../auth/schemas/auth";

type RegardeSDKLoaded = co.loaded<typeof RegardeSDK>;

/**
 * Hook to access the user's subscription list
 *
 * Returns the complete list of subscriptions from the user's payment manager.
 * This includes both active, expired, and cancelled subscriptions.
 *
 * @returns CoList of subscription objects or undefined if not loaded
 */
export const useMySubscriptions = (): co.loaded<typeof ListOfMySubscriptions> | undefined => {
  const { me } = useAccount();
  
  if (!me) return undefined;
  
  const regardeSdk = (me.root as any)?.["regarde.bio"] as RegardeSDKLoaded | undefined;
  if (!regardeSdk?.payments?.mySubscriptions) return undefined;
  
  return regardeSdk.payments.mySubscriptions;
};

/**
 * Hook to access the user's complete payment history
 *
 * Returns the full transaction history including subscriptions,
 * one-time payments, refunds, and failed transactions.
 * Events are ordered chronologically by timestamp.
 *
 * @returns CoList of payment events or undefined if not loaded
 */
export const usePaymentHistory = (): co.loaded<typeof ListOfPaymentEvents> | undefined => {
  const { me } = useAccount();
  
  if (!me) return undefined;
  
  const regardeSdk = (me.root as any)?.["regarde.bio"] as RegardeSDKLoaded | undefined;
  if (!regardeSdk?.payments?.paymentHistory) return undefined;
  
  return regardeSdk.payments.paymentHistory;
};

/**
 * Hook to check if user has active subscription to specific app
 *
 * Efficiently checks subscription status for a specific application
 * by filtering active subscriptions and matching app ID.
 * Returns subscription details if active, otherwise false.
 *
 * @param appId - Application identifier to check subscription for
 * @returns Subscription object if active subscription exists, false otherwise
 */
export const useIsSubscribed = (appId: string): MySubscriptionLoaded | false => {
  const subscriptions = useMySubscriptions();
  
  if (!subscriptions || subscriptions.length === 0) return false;
  
  const activeSubscription = subscriptions.find(sub => 
    sub && 
    sub.appId === appId && 
    sub.status === "active" && 
    sub.expiresAt > Date.now()
  );
  
  return (activeSubscription as MySubscriptionLoaded) ?? false;
};

/**
 * Helper function to check if subscription is currently valid
 *
 * Determines if a subscription is currently active and not expired.
 * Used internally by useIsSubscribed and available for direct use
 * when you have a subscription object from other sources.
 *
 * @param subscription - Subscription object to validate
 * @returns True if subscription is active and not expired
 */
export const isSubscriptionActive = (subscription: MySubscriptionLoaded): boolean => {
  return (
    subscription.status === "active" && 
    subscription.expiresAt > Date.now()
  );
};

/**
 * Helper function to get typed subscription items from CoList
 *
 * Use this function to get properly typed subscription items when
 * you need to work with individual subscriptions.
 *
 * @param subscriptions - CoList from useMySubscriptions
 * @returns Array of typed subscription objects
 */
export const getSubscriptionItems = (subscriptions: co.loaded<typeof ListOfMySubscriptions> | undefined): MySubscriptionLoaded[] => {
  if (!subscriptions) return [];
  
  return subscriptions.filter(
    (sub: any): sub is MySubscriptionLoaded => sub !== null,
  );
};

/**
 * Helper function to get typed payment event items from CoList
 *
 * Use this function to get properly typed payment event items when
 * you need to work with individual payment events.
 *
 * @param paymentHistory - CoList from usePaymentHistory
 * @returns Array of typed payment event objects
 */
export const getPaymentEventItems = (paymentHistory: co.loaded<typeof ListOfPaymentEvents> | undefined): PaymentEventLoaded[] => {
  if (!paymentHistory) return [];
  
  return paymentHistory.filter(
    (event: any): event is PaymentEventLoaded => event !== null,
  );
};