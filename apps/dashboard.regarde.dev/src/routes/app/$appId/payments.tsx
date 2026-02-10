import { createFileRoute } from "@tanstack/react-router";

import { useMyRegardeAccount } from "#/lib/account/useMyRegardeAccount";

export const Route = createFileRoute("/app/$appId/payments")({
  component: PaymentsPage,
});

function PaymentsPage(): React.ReactElement {
  const { selectedApp } = useMyRegardeAccount();

  const paymentIds =
    selectedApp?.payments?.$isLoaded === true
      ? Object.values(selectedApp.payments.all ?? {})
      : [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Payments</h1>
      <p className="mt-2 text-gray-600">
        {paymentIds.length} payments for {selectedApp?.name}
      </p>
      <p className="mt-1 text-sm text-gray-500">
        Payment Provider: {selectedApp?.paymentProvider ?? "N/A"}
      </p>
    </div>
  );
}
