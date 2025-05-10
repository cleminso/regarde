import { JazzProvider } from "jazz-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { apiKey } from "./lib/apiKey.ts";
import { OnboardingAccount } from "./lib/schema.ts";
import { JazzInspector } from "jazz-inspector";

// We use this to identify the app in the passkey auth
export const APPLICATION_NAME = "Jazz starter";

declare module "jazz-react" {
  export interface Register {
    Account: OnboardingAccount;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <JazzProvider
      sync={{
        peer: `wss://cloud.jazz.tools/?key=${apiKey}`,
      }}
      AccountSchema={OnboardingAccount}
    >
      <JazzInspector position="bottom left" /> <App />
    </JazzProvider>
  </StrictMode>,
);
