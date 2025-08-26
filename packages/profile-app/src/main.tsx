import { ClerkProvider, useClerk } from '@clerk/clerk-react';
import { JazzInspector } from 'jazz-tools/inspector';
import { JazzReactProviderWithClerk } from 'jazz-tools/react';
import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';

import { ProtectedRoute } from '#/components/auth/ProtectedRoute.tsx';
import { AppLayout } from '#/components/layouts/appLayout.tsx';
import { ThemeProvider } from '#/components/layouts/themeProvider.tsx';
import { apiKey, CLERK_PUBLISHABLE_KEY } from '#/lib/config/apiKey.ts';
import { OnboardingAccount } from '#/lib/schema.ts';
import { routes } from '#/routes';

import './index.css';

function JazzProvider({ children }: { children: React.ReactNode }) {
  const clerk = useClerk();

  return (
    <JazzReactProviderWithClerk
      clerk={clerk}
      sync={{
        peer: `wss://cloud.jazz.tools/?key=${apiKey}`,
        when: "signedUp",
      }}
      AccountSchema={OnboardingAccount}
      onLogOut={() => {
        window.location.href = '/';
      }}
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
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground font-mono">Loading...</p>
                </div>
              </div>
            }>
              <Routes>
                <Route path="/" element={<routes.LandingPage />} />

                <Route path="/:nickname" element={<AppLayout />}>
                  <Route index element={<Navigate to="about" replace />} />
                  <Route path="about" element={<routes.ProfilePage />} />
                  <Route path="now" element={<routes.ProfilePage />} />
                </Route>

                <Route element={<ProtectedRoute />}>
                  <Route path="/:nickname/edit" element={<routes.EditorPage />} />
                </Route>

                <Route path="*" element={<routes.NotFoundPage />} />
              </Routes>
            </Suspense>
          </JazzProvider>
        </ClerkProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
