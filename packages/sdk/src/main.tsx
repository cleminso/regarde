import { JazzProvider } from "jazz-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { JazzInspector } from "jazz-inspector";
import { apiKey } from "./apiKey.ts";
import { OnboardingAccount, OnboardingProfile } from "./schema.ts";
export { Account, CoMap, Group, Profile, co } from "jazz-tools";

// We use this to identify the app in the passkey auth
export const APPLICATION_NAME = "Jazz starter";

declare module "jazz-react" {
  export interface Register {
    Profile: OnboardingProfile;
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
      <App />

      <JazzInspector />
    </JazzProvider>
  </StrictMode>,
);

export {
  OnboardingAccount,
  OnboardingProfile,
  AccountRoot,
  Container,
  SocialLinks,
} from "./schema.ts";
