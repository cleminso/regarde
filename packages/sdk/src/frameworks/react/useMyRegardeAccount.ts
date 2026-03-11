import type { MaybeLoaded, CoList } from "jazz-tools";
import { useAccount } from "jazz-tools/react";
import { useMemo } from "react";

import { RegardeAccount } from "#schemas/regardeAccount";
import type { TRegardeAccount } from "#schemas/regardeAccount";
import { RegardeSDK } from "#schemas/regardeSDK";
import type {
  TRegardeSDK,
  TPaymentSchema,
  TSubscriptionSchema,
  TLicenseSchema,
} from "#schemas/regardeSDK";
import { RegardeTokenAuth } from "#schemas/regardeTokenAuth";
import type { TRegardeAuthLoaded } from "#schemas/regardeTokenAuth";
import { RegardeApp } from "#schemas/regardeUserApp";
import type { TRegardeApp } from "#schemas/regardeUserApp";
import { UserHandle } from "#schemas/regardeUserHandle";
import type { TUserHandleLoaded } from "#schemas/regardeUserHandle";

// =============================================================================
// Field Resolution Types (exported for documentation)
// =============================================================================

/**
 * Simple field - shallow load (true)
 */
export type TSimpleField = true;

/**
 * App field resolution options
 */
export type TAppField =
  | { $each: true }
  | { $each: { payments?: true; subscriptions?: true; licenses?: true } };

/**
 * Payment schema field resolution options
 */
export type TPaymentField = true | { all?: true; byApp?: true };

/**
 * Subscription schema field resolution options
 */
export type TSubscriptionField = true | { all?: true; byApp?: true; status?: true };

/**
 * License schema field resolution options
 */
export type TLicenseField = true | { all?: true; byApp?: true };

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
export interface TUseMyRegardeAccountResolve {
  auth?: TSimpleField;
  myUserHandle?: TSimpleField;
  myApps?: TAppField;
  myPayments?: TPaymentField;
  mySubscriptions?: TSubscriptionField;
  myLicenses?: TLicenseField;
}

// =============================================================================
// Result Type
// =============================================================================

/**
 * Result of useMyRegardeAccount hook.
 *
 * Fields are typed based on your resolve configuration:
 * - Fields you requested will be available when isReady is true
 * - Fields you didn't request will be null
 * - Account is always returned as MaybeLoaded for loading state handling
 *
 * @example
 * ```typescript
 * // With { auth: true, myApps: { $each: true } }
 * const { isReady, account, myApps, auth } = useMyRegardeAccount({ resolve: {...} });
 *
 * if (!account.$isLoaded) {
 *   switch (account.$jazz.loadingState) {
 *     case "loading":
 *       return <div>Loading account...</div>;
 *     case "unavailable":
 *       return <div>Account not found</div>;
 *     case "unauthorized":
 *       return <div>Access denied</div>;
 *   }
 * }
 *
 * if (isReady) {
 *   // auth is TRegardeAuthLoaded (not null)
 *   // myApps is CoList<TApp> with all apps loaded
 *   auth.token; // string - accessible
 *   myApps.forEach(app => app.name); // TApp - accessible
 * }
 * ```
 */
export interface TUseMyRegardeAccountResult {
  /** True when account is loaded, authenticated, and all requested fields are available */
  isReady: boolean;
  /** True when account is authenticated */
  isAuthenticated: boolean;
  /** The RegardeAccount with loading state information */
  account: MaybeLoaded<TRegardeAccount>;
  /** The loaded RegardeSDK or null if not loaded */
  regardeSDK: TRegardeSDK | null;
  /** Auth token CoMap when auth field is requested and loaded, null otherwise */
  auth: TRegardeAuthLoaded | null;
  /** User handle CoMap when myUserHandle field is requested and loaded, null otherwise */
  myUserHandle: TUserHandleLoaded | null;
  /** User's nickname string when myUserHandle is loaded, null otherwise */
  userNickname: string | null;
  /** Apps CoList when myApps field is requested and loaded, null otherwise */
  myApps: CoList<TRegardeApp> | null;
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
 *
 * @param fields - Field resolution configuration
 * @returns Jazz resolve configuration object
 */
function buildResolveConfig(fields: TUseMyRegardeAccountResolve): Record<string, unknown> {
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
 *
 * @param value - The value to check
 * @returns True if the value is a loaded CoValue
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
 * The account is returned as MaybeLoaded<TRegardeAccount>, allowing you to handle
 * loading states, errors, and unauthorized access with full type safety.
 *
 * @example
 * ```tsx
 * // Load auth and apps
 * function AppList() {
 *   const { isReady, account, myApps, auth } = useMyRegardeAccount({
 *     resolve: { auth: true, myApps: { $each: true } }
 *   });
 *
 *   if (!account.$isLoaded) {
 *     switch (account.$jazz.loadingState) {
 *       case "loading":
 *         return <div>Loading account...</div>;
 *       case "unavailable":
 *         return <div>Account not found</div>;
 *       case "unauthorized":
 *         return <div>Access denied</div>;
 *     }
 *   }
 *
 *   if (isReady === false) return <div>Loading SDK fields...</div>;
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
 *   const { isReady, account, myApps } = useMyRegardeAccount({
 *     resolve: { myApps: { $each: { payments: true } } }
 *   });
 *
 *   if (!account.$isLoaded) {
 *     return <div>Loading account...</div>;
 *   }
 *
 *   if (isReady === false) return <div>Loading apps...</div>;
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
 *   const { account } = useMyRegardeAccount();
 *
 *   if (!account.$isLoaded) {
 *     return <div>Loading...</div>;
 *   }
 *
 *   return <div>Account ID: {account.$jazz.id}</div>;
 * }
 * ```
 *
 * @param options - Field resolution configuration with `resolve` property
 * @returns Account state with typed loaded fields
 */
export function useMyRegardeAccount(
  options: { resolve?: TUseMyRegardeAccountResolve } = {},
): TUseMyRegardeAccountResult {
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
        account: account as MaybeLoaded<TRegardeAccount>,
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
    const isRootLoaded = isAccountLoaded && account.root !== null && isLoadedCoValue(account.root);

    // Check if SDK is loaded
    const sdk = isRootLoaded ? account.root["regarde-sdk"] : null;
    const isSdkLoaded = sdk !== null && isLoadedCoValue<TRegardeSDK>(sdk);

    // Determine overall readiness (all requested fields must be loaded)
    const isReady = isAccountLoaded && isRootLoaded && isSdkLoaded;

    // Extract requested fields with type safety
    const auth =
      isSdkLoaded && resolve.auth === true && isLoadedCoValue(sdk.auth) ? sdk.auth : null;

    const myUserHandle =
      isSdkLoaded && resolve.myUserHandle === true && isLoadedCoValue(sdk.myUserHandle)
        ? sdk.myUserHandle
        : null;

    const userNickname = myUserHandle !== null ? myUserHandle.nickname : null;

    // Extract myApps if requested
    let myApps: CoList<TRegardeApp> | null = null;
    if (isSdkLoaded && resolve.myApps !== undefined) {
      const appsValue = sdk.myApps;
      if (isLoadedCoValue<CoList<TRegardeApp>>(appsValue)) {
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
      account: account as MaybeLoaded<TRegardeAccount>,
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
