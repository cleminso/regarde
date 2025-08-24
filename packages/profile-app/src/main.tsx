import { ClerkProvider, useClerk } from '@clerk/clerk-react';
import { JazzInspector } from 'jazz-tools/inspector';
import { JazzReactProviderWithClerk } from 'jazz-tools/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';

import { ProtectedRoute } from '#/components/auth/ProtectedRoute.tsx';
import { AppLayout } from '#/components/layouts/appLayout.tsx';
import { ThemeProvider } from '#/components/layouts/themeProvider.tsx';
import { apiKey, CLERK_PUBLISHABLE_KEY } from '#/lib/config/apiKey.ts';
import { OnboardingAccount } from '#/lib/schema.ts';
import { EditorPage } from '#/routes/edit.tsx';
import { LandingPage } from '#/routes/landing.tsx';
import { NotFoundPage } from '#/routes/notFound.tsx';
import { ProfilePage } from '#/routes/profile.tsx';

import './index.css';

function JazzProvider({ children }: { children: React.ReactNode }) {
  const clerk = useClerk();

  return (
    <JazzReactProviderWithClerk
      clerk={clerk}
      sync={{
        peer: `wss://cloud.jazz.tools/?key=${apiKey}`,
      }}
      AccountSchema={OnboardingAccount}
    >
      {children}
    </JazzReactProviderWithClerk>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <BrowserRouter>
        <ClerkProvider
          publishableKey={CLERK_PUBLISHABLE_KEY}
          afterSignOutUrl="/"
        >
          <JazzProvider>
            <JazzInspector position="bottom left" />
            <Routes>
              <Route path="/" element={<LandingPage />} />

              <Route path="/:nickname" element={<AppLayout />}>
                <Route index element={<Navigate to="about" replace />} />
                <Route path="about" element={<ProfilePage />} />
                <Route path="now" element={<ProfilePage />} />
              </Route>

              <Route element={<ProtectedRoute />}>
                <Route path="/:nickname/edit" element={<EditorPage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </JazzProvider>
        </ClerkProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
