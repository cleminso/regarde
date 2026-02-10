import { createFileRoute } from "@tanstack/react-router";

import { RegisterAppWizard } from "#/components/register-app/registerAppWizard";

export const Route = createFileRoute("/register-app")({
  component: RegisterAppPage,
});

function RegisterAppPage(): React.ReactElement {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <RegisterAppWizard />
    </div>
  );
}
