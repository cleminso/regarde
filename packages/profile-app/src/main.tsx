import { JazzInspector } from 'jazz-inspector';
import { JazzProvider } from 'jazz-react';
import { InstanceOfSchema } from 'jazz-tools';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router';

import { ThemeProvider } from './components/theme-provider.tsx';
import { apiKey } from './lib/apiKey.ts';
import { OnboardingAccount } from './lib/schema.ts';
import { AppLayout } from './pages/appLayout.tsx';
import { EditorPage } from './pages/edit.tsx';
import { HomePage } from './pages/home.tsx';
import { ProfilePage } from './pages/profile.tsx';
import { ProtectedRoute } from './ProtectedRoute.tsx';

import './index.css';

import { NotFoundPage } from './pages/notFoundPage.tsx';

export const APPLICATION_NAME = 'Jazz Profile';

declare module 'jazz-react' {
  export interface Register {
    Account: InstanceOfSchema<typeof OnboardingAccount>;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <JazzProvider
        sync={{
          peer: `wss://cloud.jazz.tools/?key=${apiKey}`,
        }}
        guestMode={false}
        onLogOut={() => {
          console.log('Going back to /');
          window.location.href = '/';
        }}
        AccountSchema={OnboardingAccount}
      >
        <BrowserRouter>
          <JazzInspector position="bottom left" />
          <Routes>
            <Route path="/" element={<HomePage />} />

            <Route path="/:nickname" element={<AppLayout />}>
              <Route index element={<ProfilePage />} />
              <Route element={<ProtectedRoute />}>
                <Route path="edit" element={<EditorPage />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </JazzProvider>
    </ThemeProvider>
  </StrictMode>,
);
