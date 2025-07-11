import { useAccount, useIsAuthenticated } from 'jazz-tools/react';
import { Link, Outlet } from 'react-router';

import { AuthButton } from './AuthButton.tsx';
import { ThemeToggle } from './components/themeToggle.tsx';
import { OnboardingAccount } from './lib/schema.ts';
import { useLayout } from './pages/layoutContext.tsx';

export function AppLayout() {
  const { me } = useAccount(OnboardingAccount, {
    resolve: { profile: true },
  });
  const isAuthenticated = useIsAuthenticated();
  const { showHeader } = useLayout();

  return (
    <>
      {showHeader && (
        <header className="bg-background text-card-foreground shadow-lg">
          <nav className="@container-normal flex justify-between items-center py-4 mx-16">
            <div>
              <Link to="/" className="mr-6 rounded-sm">
                <img
                  src="/favicon.svg"
                  alt="Jazz Profile"
                  className="w-9 h-9"
                />
              </Link>
            </div>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <span>
                  {me === undefined
                    ? 'Loading...'
                    : me?.profile?.name
                      ? `Hello, ${me.profile.name}`
                      : 'Logged In'}
                </span>
              ) : (
                <span></span>
              )}
              <ThemeToggle />
              <AuthButton />{' '}
            </div>
          </nav>
        </header>
      )}

      <main
        className={`container-full bg-background ${showHeader ? 'py-6' : ''}`}
      >
        <Outlet />
      </main>

      <footer className=""></footer>
    </>
  );
}
