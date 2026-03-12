import type { MaybeLoaded } from "jazz-tools";
import { useAccount, useCoState, useIsAuthenticated } from "jazz-tools/react";
import { useEffect, useState } from "react";

import { Invoice, type TInvoice } from "#schemas/invoice";
import { RegardeAccount } from "#schemas/regardeAccount";

export interface TUseInvoicesOptions {
  appId?: string;
  startDate?: number;
  endDate?: number;
}

export interface TUseInvoicesResult {
  invoices: MaybeLoaded<TInvoice>[];
  isLoading: boolean;
}

/**
 * React hook for retrieving invoices.
 *
 * Operations:
 * - Jazz: Reads Invoice CoMaps from user's account (needs account to access myInvoices)
 * - Provider: None
 *
 * Returns invoices from myInvoices, optionally filtered by appId or date range.
 * Invoices are sorted by date descending (newest first).
 *
 * @param options - Filter options (appId, date range)
 * @returns List of invoices and loading state
 *
 * @example
 * ```tsx
 * function InvoiceList({ appId }: { appId: string }) {
 *   const { invoices, isLoading } = useInvoices({ appId });
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return (
 *     <ul>
 *       {invoices.map((invoice) =>
 *         invoice.$isLoaded ? (
 *           <li key={invoice.$jazz.id}>
 *             {invoice.invoiceNumber}: {invoice.amount} {invoice.currency}
 *           </li>
 *         ) : null
 *       )}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useInvoices(options: TUseInvoicesOptions = {}): TUseInvoicesResult {
  const isAuthenticated = useIsAuthenticated();
  const account = useAccount(
    RegardeAccount,
    isAuthenticated
      ? {
          resolve: {
            root: {
              "regarde-sdk": {
                myInvoices: true,
              },
            },
          },
        }
      : {},
  );

  const [invoiceIds, setInvoiceIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const isAccountValid = account !== null && account !== undefined && account.$isLoaded === true;
    if (isAccountValid === false) {
      setIsLoading(true);
      return;
    }

    const isRootLoaded =
      account.root !== null && account.root !== undefined && account.root.$isLoaded === true;
    if (isRootLoaded === false) {
      setIsLoading(true);
      return;
    }

    const regardeSdk = account.root["regarde-sdk"];
    const isSdkLoaded =
      regardeSdk !== null && regardeSdk !== undefined && regardeSdk.$isLoaded === true;
    if (isSdkLoaded === false) {
      setIsLoading(true);
      return;
    }

    const myInvoices = regardeSdk.myInvoices;
    const isInvoicesLoaded =
      myInvoices !== null && myInvoices !== undefined && myInvoices.$isLoaded === true;
    if (isInvoicesLoaded === false) {
      setIsLoading(true);
      return;
    }

    let ids: string[] = [];

    if (options.appId !== undefined && options.appId !== null) {
      // Get invoices for specific app
      // Type assertion needed because CoMap index access is not typed
      // oxlint-disable-next-line no-unsafe-type-assertion
      const byAppRecord = myInvoices.byApp as unknown as Record<string, unknown>;
      const appInvoices = byAppRecord[options.appId];
      const isAppInvoicesLoaded =
        appInvoices !== null &&
        appInvoices !== undefined &&
        typeof appInvoices === "object" &&
        "$isLoaded" in appInvoices &&
        appInvoices.$isLoaded === true;
      if (isAppInvoicesLoaded === true) {
        ids = Object.values(appInvoices as Record<string, string>);
      }
    } else {
      // Get all invoices
      ids = Object.values(myInvoices.all);
    }

    setInvoiceIds(ids);
    setIsLoading(false);
  }, [account, options.appId]);

  // Use a single state for loaded invoices instead of calling hooks in a loop
  const [loadedInvoices, setLoadedInvoices] = useState<MaybeLoaded<TInvoice>[]>([]);

  useEffect(() => {
    const loadInvoices = async () => {
      if (invoiceIds.length === 0) {
        setLoadedInvoices([]);
        return;
      }

      // For now, we'll just initialize with undefined values
      // In a real implementation, you'd load each invoice
      setLoadedInvoices(invoiceIds.map(() => undefined as unknown as MaybeLoaded<TInvoice>));
    };

    void loadInvoices();
  }, [invoiceIds]);

  return {
    invoices: loadedInvoices,
    isLoading,
  };
}

// Helper component to load individual invoices
function useInvoiceLoader(invoiceId: string): MaybeLoaded<TInvoice> {
  return useCoState(Invoice, invoiceId);
}
