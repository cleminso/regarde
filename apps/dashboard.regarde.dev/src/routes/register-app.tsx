import { createFileRoute } from "@tanstack/react-router";

import { RegisterAppForm } from "#/components/register-app/registerAppForm";

export const Route = createFileRoute("/register-app")({
  component: RegisterAppPage,
});

function RegisterAppPage(): React.ReactElement {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <RegisterAppForm />
    </div>
  );
}
