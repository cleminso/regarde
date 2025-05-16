import { JazzProvider } from "jazz-react";
import { StrictMode } from "react";
import "./index.css";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { OnboardingAccount } from "./lib/schema.ts";
import { ThemeProvider } from "./components/theme-provider.tsx";

import { HomePage } from "./pages/home.tsx";
import { AppLayout } from "./pages/appLayout.tsx";
import { Editor as EditProfilePage } from "./pages/edit.tsx";
import { Profile as ViewProfilePage } from "./pages/profile.tsx";

import "./index.css";
import { apiKey } from "./lib/apiKey.ts";
import { JazzInspector } from "jazz-inspector";

export const APPLICATION_NAME = "Jazz Profile";

declare module "jazz-react" {
  export interface Register {
    Account: OnboardingAccount;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <JazzProvider
        sync={{
          peer: `wss://cloud.jazz.tools/?key=${apiKey}`,
        }}
        AccountSchema={OnboardingAccount}
      >
        <BrowserRouter>
          <JazzInspector position="bottom left" />
          <Routes>
            <Route path="/" element={<HomePage />} />

            <Route element={<AppLayout />}>
              <Route path="/edit" element={<EditProfilePage />} />
              <Route path="/profile" element={<ViewProfilePage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </JazzProvider>
    </ThemeProvider>
  </StrictMode>,
);
