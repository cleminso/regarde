import { useAccount } from "jazz-tools/react";
import type { co, CoList } from "jazz-tools";
import { useMemo } from "react";

import { RegardeAccount } from "#schemas/regardeAccount";
import type { TRegardeAccount } from "#schemas/regardeAccount";
import { RegardeSDK } from "#schemas/regardeSDK";
import type { TRegardeSDK, TPaymentSchema, TSubscriptionSchema, TLicenseSchema } from "#schemas/regardeSDK";
import { App } from "#schemas/regardeUserApp";
import type { TApp } from "#schemas/regardeUserApp";
import { UserHandle } from "#schemas/regardeUserHandle";
import type { TUserHandleLoaded } from "#schemas/regardeUserHandle";
import { RegardeTokenAuth } from "#schemas/regardeTokenAuth";
import type { TRegardeAuthLoaded } from "#schemas/regardeTokenAuth";

// =============================================================================
// Field Resolution Types (exported for documentation)
// =============================================================================

/**
 * Simple field - shallow load (true)
 */
export type SimpleField = true;

/**
 * App field resolution options
 */
export type AppField =
  | { $each: true }
  | { $each: { payments?: true; subscriptions?: true; licenses?: true } };

/**
 * Payment schema field resolution options
 */
export type PaymentField =
  | true
  | { all?: true; byApp?: true };

/**
 * Subscription schema field resolution options
 */
export type SubscriptionField =
  | true
  | { all?: true; byApp?: true; status?: true };

/**
 * License schema field resolution options
 */
export type LicenseField =
  | true
  | { all?: true; byApp?: true };

/**
 * Configuration for loading specific RegardeSDK fields.
 *
 * Each field can be loaded shallowly (true) or with nested resolution.
 *
 * @example
 * ```typescript
 * // Load only auth token
 * { auth: true }
 *
 * // Load all apps with details
 * { myApps: { $each: true } }
 *
 * // Load apps with their payment records
 * { myApps: { $each: { payments: true } } }
 *
 * // Load payments with nested maps
 * { myPayments: { all: true, byApp: true } }
 * ```
 */
export interface UseMyRegardeAccountResolve {
  auth?: SimpleField;
  myUserHandle?: SimpleField;
  myApps?: AppField;
  myPayments?: PaymentField;
  mySubscriptions?: SubscriptionField;
  myLicenses?: LicenseField;
}

// =============================================================================
// Result Type
// =============================================================================

/**
 * Result of useMyRegardeAccount hook.
 *
 * Fields are typed based on your resolve configuration:
 * - Fields you requested will be CoValues (with $isLoaded = true) when isReady is true
 * - Fields you didn't request will be null
 *
 * @example
 * ```typescript
 * // With { auth: true, myApps: { $each: true } }
 * const { isReady, auth, myApps } = useMyRegardeAccount({ resolve: {...} });
 *
 * if (isReady) {
 *   // auth is TRegardeAuthLoaded (not null, not MaybeLoaded)
 *   // myApps is CoList<TApp> with all apps loaded
 *   auth.token; // string - accessible
 *   myApps.forEach(app => app.name); // TApp - accessible
 * }
 * ```
 */
export interface UseMyRegardeAccountResult {
  /** True when account is loaded, authenticated, and all requested fields are available */
  isReady: boolean;
  /** True when account is authenticated */
  isAuthenticated: boolean;
  /** The loaded RegardeAccount or null if not loaded */
  account: TRegardeAccount | null;
  /** The loaded RegardeSDK or null if not loaded */
  regardeSDK: TRegardeSDK | null;
  /** Auth token CoMap when auth field is requested and loaded, null otherwise */
  auth: TRegardeAuthLoaded | null;
  /** User handle CoMap when myUserHandle field is requested and loaded, null otherwise */
  myUserHandle: TUserHandleLoaded | null;
  /** User's nickname string when myUserHandle is loaded, null otherwise */
  userNickname: string | null;
  /** Apps CoList when myApps field is requested and loaded, null otherwise */
  myApps: CoList<TApp> | null;
  /** Payments CoMap when myPayments field is requested and loaded, null otherwise */
  myPayments: TPaymentSchema | null;
  /** Subscriptions CoMap when mySubscriptions field is requested and loaded, null otherwise */
  mySubscriptions: TSubscriptionSchema | null;
  /** Licenses CoMap when myLicenses field is requested and loaded, null otherwise */
  myLicenses: TLicenseSchema | null;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Builds Jazz resolve configuration from user-friendly field config
 */
function buildResolveConfig(
  fields: UseMyRegardeAccountResolve
): Record<string, unknown> {
  const hasFields = Object.keys(fields).length > 0;
  if (hasFields === false) {
    return { root: true };
  }

  const regardeSdkResolve: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      regardeSdkResolve[key] = value;
    }
  }

  return {
    root: {
      "regarde-sdk": regardeSdkResolve,
    },
  };
}

/**
 * Type guard to check if a value is a loaded CoValue
 */
function isLoadedCoValue<T>(value: unknown): value is T & { $isLoaded: true } {
  return (
    value !== null &&
    value !== undefined &&
    typeof value === "object" &&
    "$isLoaded" in value &&
    (value as { $isLoaded: boolean }).$isLoaded === true
  );
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * React hook for loading selective fields from the current user's RegardeAccount.
 *
 * Provides granular control over which RegardeSDK fields to load. When you specify
 * a field in the resolve config and isReady is true, that field is guaranteed to
 * be loaded and accessible without additional checks.
 *
 * @example
 * ```tsx
 * // Load auth and apps
 * function AppList() {
 *   const { isReady, myApps, auth } = useMyRegardeAccount({
 *     resolve: { auth: true, myApps: { $each: true } }
 *   });
 *
 *   if (isReady === false) return <div>Loading...</div>;
 *
 *   // TypeScript knows myApps is loaded CoList<TApp>
 *   return (
 *     <ul>
 *       {myApps.map(app => (
 *         <li key={app.$jazz.id}>{app.name}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 *
 * // Load apps with nested payment records
 * function AppWithPayments() {
 *   const { isReady, myApps } = useMyRegardeAccount({
 *     resolve: { myApps: { $each: { payments: true } } }
 *   });
 *
 *   if (isReady === false) return <div>Loading...</div>;
 *
 *   // TypeScript knows app.payments is loaded (if requested in resolve)
 *   return myApps.map(app => (
 *     <div key={app.$jazz.id}>
 *       <h3>{app.name}</h3>
 *       <p>Payments: {app.payments.all.size}</p>
 *     </div>
 *   ));
 * }
 *
 * // Default: no SDK fields loaded
 * function AccountInfo() {
 *   const { account, isReady } = useMyRegardeAccount();
 *   return <div>Authenticated: {isReady ? 'Yes' : 'No'}</div>;
 * }
 * ```
 *
 * @param options - Field resolution configuration with `resolve` property
 * @returns Account state with typed loaded fields
 */
export function useMyRegardeAccount(
  options: { resolve?: UseMyRegardeAccountResolve } = {}
): UseMyRegardeAccountResult {
  const { resolve = {} } = options;

  // Build resolve configuration from fields
  const resolveConfig = useMemo(() => buildResolveConfig(resolve), [resolve]);

  // Load account with configured resolution
  const account = useAccount(RegardeAccount, {
    resolve: resolveConfig,
  });

  // Derive loading states and extracted values
  const result = useMemo(() => {
    const isAccountLoaded = account !== null && account.$isLoaded === true;
    const isAuthenticated = isAccountLoaded;

    // If no fields requested, just return account info
    const hasRequestedFields = Object.keys(resolve).length > 0;
    if (hasRequestedFields === false) {
      return {
        isReady: isAccountLoaded,
        isAuthenticated,
        account: isAccountLoaded ? (account as TRegardeAccount) : null,
        regardeSDK: null,
        auth: null,
        myUserHandle: null,
        userNickname: null,
        myApps: null,
        myPayments: null,
        mySubscriptions: null,
        myLicenses: null,
      };
    }

    // Check if root is loaded
    const isRootLoaded =
      isAccountLoaded &&
      account.root !== null &&
      isLoadedCoValue(account.root);

    // Check if SDK is loaded
    const sdk = isRootLoaded
      ? account.root["regarde-sdk"]
      : null;
    const isSdkLoaded = sdk !== null && isLoadedCoValue<TRegardeSDK>(sdk);

    // Determine overall readiness (all requested fields must be loaded)
    const isReady = isAccountLoaded && isRootLoaded && isSdkLoaded;

    // Extract requested fields with type safety
    const auth = isSdkLoaded && resolve.auth === true && isLoadedCoValue(sdk.auth)
      ? sdk.auth
      : null;

    const myUserHandle = isSdkLoaded && resolve.myUserHandle === true && isLoadedCoValue(sdk.myUserHandle)
      ? sdk.myUserHandle
      : null;

    const userNickname = myUserHandle !== null ? myUserHandle.nickname : null;

    // Extract myApps if requested
    let myApps: CoList<TApp> | null = null;
    if (isSdkLoaded && resolve.myApps !== undefined) {
      const appsValue = sdk.myApps;
      if (isLoadedCoValue<CoList<TApp>>(appsValue)) {
        myApps = appsValue;
      }
    }

    // Extract myPayments if requested
    let myPayments: TPaymentSchema | null = null;
    if (isSdkLoaded && resolve.myPayments !== undefined) {
      const paymentsValue = sdk.myPayments;
      if (isLoadedCoValue(paymentsValue)) {
        myPayments = paymentsValue;
      }
    }

    // Extract mySubscriptions if requested
    let mySubscriptions: TSubscriptionSchema | null = null;
    if (isSdkLoaded && resolve.mySubscriptions !== undefined) {
      const subscriptionsValue = sdk.mySubscriptions;
      if (isLoadedCoValue(subscriptionsValue)) {
        mySubscriptions = subscriptionsValue;
      }
    }

    // Extract myLicenses if requested
    let myLicenses: TLicenseSchema | null = null;
    if (isSdkLoaded && resolve.myLicenses !== undefined) {
      const licensesValue = sdk.myLicenses;
      if (isLoadedCoValue(licensesValue)) {
        myLicenses = licensesValue;
      }
    }

    return {
      isReady,
      isAuthenticated,
      account: isAccountLoaded ? (account as TRegardeAccount) : null,
      regardeSDK: isSdkLoaded ? sdk : null,
      auth,
      myUserHandle,
      userNickname,
      myApps,
      myPayments,
      mySubscriptions,
      myLicenses,
    };
  }, [account, resolve]);

  return result;
}
