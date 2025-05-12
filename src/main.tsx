import { JazzProvider } from "jazz-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import OriginalAppContent from "./App.tsx";
import "./index.css";
import { apiKey } from "./lib/apiKey.ts";
import { OnboardingAccount } from "./lib/schema.ts";
import { JazzInspector } from "jazz-inspector";
import { Layout } from "./layout.tsx";
import { Profile } from "./pages/Profile.tsx";

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
      <BrowserRouter>
        <JazzInspector position="bottom left" />
        <Routes>
          <Route path="/" element={<OriginalAppContent />} />

          <Route element={<Layout />}>
            {" "}
            {/* The Layout component wraps these child routes */}
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </JazzProvider>
  </StrictMode>,
);
