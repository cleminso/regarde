import { JazzInspector } from 'jazz-inspector';
import { JazzProvider } from 'jazz-react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { ThemeProvider } from './components/theme-provider.tsx';
import { apiKey } from './lib/apiKey.ts';
import { OnboardingAccount } from './lib/schema.ts';
import { AppLayout } from './pages/appLayout.tsx';
import { EditorPage } from './pages/edit.tsx';
import { HomePage } from './pages/home.tsx';
import { ProfilePage } from './pages/profile.tsx';

import './index.css';

export const APPLICATION_NAME = 'Jazz Profile';

declare module 'jazz-react' {
  export interface Register {
    Account: OnboardingAccount;
  }
}

createRoot(document.getElementById('root')!).render(
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
              <Route path="/edit" element={<EditorPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </JazzProvider>
    </ThemeProvider>
  </StrictMode>,
);
