import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/register-app")({
  component: RegisterAppPage,
});

function RegisterAppPage(): React.ReactElement {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Register Your First App</h1>
          <p className="mt-2 text-gray-600">
            Get started by creating your first app to track payments and analytics.
          </p>
        </div>

        <div className="rounded-lg border p-6">
          <form className="space-y-4">
            <div>
              <label htmlFor="appName" className="block text-sm font-medium text-gray-700">
                App Name
              </label>
              <input
                type="text"
                id="appName"
                name="appName"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                placeholder="My Awesome App"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Create App
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
