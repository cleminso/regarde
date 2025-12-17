import { App } from "../schemas";
import { Account } from "jazz-tools";

/**
 * Returns the payment history for the provided user within the context of the provided App.
 * 
 * @param app The Regarde App instance (optional/loaded)
 * @param me The current user account (optional/loaded)
 * @returns List of payments or undefined if loading/not found.
 */
export const usePaymentHistory = (app: App | undefined | null, me: Account | undefined | null) => {
    if (!app || !me) return undefined;

    const userId = (me as any).id || (me as any)._id;
    if (!userId) return undefined;

    // CoMap access: app.paymentsByUser[userId]
    // Optimistic / Reactive access via Jazz
    return (app.paymentsByUser as any)?.[userId];
}

/**
 * Returns whether the current user has an active subscription/access.
 * 
 * @param app The Regarde App instance
 * @param me The current user account
 * @returns boolean
 */
export const useSubscription = (app: App | undefined | null, me: Account | undefined | null) => {
    const payments = usePaymentHistory(app, me);

    // Default to false if no payments or not loaded
    if (!payments) return false;

    // Check for any completed payment
    return (payments as any[]).some((p: any) => p && p.paymentStatus === 'completed');
}
