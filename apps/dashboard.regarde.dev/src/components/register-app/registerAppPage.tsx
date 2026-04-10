import { Navigate } from "@tanstack/react-router";

import { RegisterAppForm } from "#register-app/registerAppForm";
import { useMyRegardeAccount } from "@regarde-dev/core/react";

//  Renders the registration form for authenticated users
export function RegisterAppPage(): React.ReactElement {
  const { account } = useMyRegardeAccount({
    resolve: { auth: true },
  });

  if (account.$isLoaded === false) {
    switch (account.$jazz.loadingState) {
      case "unauthorized":
        return <Navigate to="/" />;

      case "loading":
        return (
          <div className="flex min-h-screen flex-col items-center justify-center p-6" />
        );

      case "unavailable":
        return (
          <div className="flex min-h-screen flex-col items-center justify-center p-6">
            <p className="text-destructive">Account unavailable</p>
          </div>
        );
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 w-full">
      <div className="w-full max-w-md">
        <RegisterAppForm />
      </div>
    </div>
  );
}
