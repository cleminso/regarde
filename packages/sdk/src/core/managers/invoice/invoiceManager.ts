import { RegardeError, REGARDE_ERROR_CODES } from "#core/errors";
import { Invoice } from "#schemas/invoice";
import type { TInvoice } from "#schemas/invoice";
import type { TRegardeAccount } from "#schemas/regardeAccount";

export interface TListInvoicesOptions {
  appId?: string;
  startDate?: number;
  endDate?: number;
}

export interface TListInvoicesResult {
  invoices: TInvoice[];
}

/**
 * Lists invoices for the user.
 *
 * Returns all invoices from myInvoices, optionally filtered by appId or date range.
 * Invoices are sorted by date descending (newest first).
 *
 * @param account - The RegardeAccount to list invoices for
 * @param options - Filter options (appId, date range)
 * @returns List of invoices
 */
export const listInvoices = async (
  account: TRegardeAccount,
  options: TListInvoicesOptions = {},
): Promise<TListInvoicesResult> => {
  const isAccountLoaded = account !== null && account.$isLoaded === true;
  if (isAccountLoaded === false) {
    throw new RegardeError(
      "Account must be loaded to list invoices",
      REGARDE_ERROR_CODES.ACCOUNT_NOT_LOADED,
    );
  }

  const isRootLoaded =
    account.root !== null && account.root !== undefined && account.root.$isLoaded === true;
  if (isRootLoaded === false) {
    throw new RegardeError("Account root must be loaded", REGARDE_ERROR_CODES.SDK_NOT_INITIALIZED);
  }

  const regardeSdk = account.root["regarde-sdk"];
  const isSdkLoaded =
    regardeSdk !== null && regardeSdk !== undefined && regardeSdk.$isLoaded === true;
  if (isSdkLoaded === false) {
    throw new RegardeError(
      "RegardeSDK must be initialized",
      REGARDE_ERROR_CODES.SDK_NOT_INITIALIZED,
    );
  }

  const myInvoices = regardeSdk.myInvoices;
  const isInvoicesLoaded =
    myInvoices !== null && myInvoices !== undefined && myInvoices.$isLoaded === true;
  if (isInvoicesLoaded === false) {
    throw new RegardeError("Invoices not loaded", REGARDE_ERROR_CODES.COMAP_NOT_FOUND);
  }

  // Ensure all records are loaded
  const { all, byApp } = await myInvoices.$jazz.ensureLoaded({
    resolve: { all: true, byApp: true },
  });

  // Get all invoice IDs
  let invoiceIds: string[] = [];

  if (options.appId !== undefined && options.appId !== null) {
    // Get invoices for specific app
    const appInvoices = byApp[options.appId];
    const isAppInvoicesLoaded =
      appInvoices !== null && appInvoices !== undefined && appInvoices.$isLoaded === true;
    if (isAppInvoicesLoaded === true) {
      invoiceIds = Object.values(appInvoices);
    }
  } else {
    // Get all invoices
    invoiceIds = Object.values(all);
  }

  // Load all invoices
  const invoices: TInvoice[] = [];
  for (const invoiceId of invoiceIds) {
    const invoice = await Invoice.load(invoiceId, { loadAs: account });
    const isInvoiceLoaded = invoice !== null && invoice !== undefined && invoice.$isLoaded === true;
    if (isInvoiceLoaded === true) {
      // Apply date filters
      const isAfterStart = options.startDate === undefined || invoice.date >= options.startDate;
      const isBeforeEnd = options.endDate === undefined || invoice.date <= options.endDate;
      const isDateInRange = isAfterStart && isBeforeEnd;

      if (isDateInRange === true) {
        invoices.push(invoice);
      }
    }
  }

  // Sort by date descending
  invoices.sort((a, b) => b.date - a.date);

  return { invoices };
};

/**
 * Gets a single invoice by ID.
 *
 * @param account - The RegardeAccount
 * @param invoiceId - The Invoice CoMap ID
 * @returns The invoice or null if not found
 */
export const getInvoice = async (
  account: TRegardeAccount,
  invoiceId: string,
): Promise<TInvoice | null> => {
  const isAccountLoaded = account !== null && account.$isLoaded === true;
  if (isAccountLoaded === false) {
    throw new RegardeError(
      "Account must be loaded to get invoice",
      REGARDE_ERROR_CODES.ACCOUNT_NOT_LOADED,
    );
  }

  const invoice = await Invoice.load(invoiceId, { loadAs: account });
  const isInvoiceLoaded = invoice !== null && invoice !== undefined && invoice.$isLoaded === true;
  if (isInvoiceLoaded === false) {
    return null;
  }

  return invoice;
};
