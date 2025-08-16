import { Outlet } from 'react-router';

import { AuthButton } from './AuthButton.tsx';
import { ThemeToggle } from './components/themeToggle.tsx';
import { useMyJazz } from './lib/account/useMyJazz.ts';
import { useLayout } from './pages/layoutContext.tsx';

export function AppLayout() {
  const { account, isAuthenticated } = useMyJazz();
  const { showHeader } = useLayout();

  return (
    <>
      {showHeader && (
        <header className="bg-background text-card-foreground shadow-lg">
          <nav className="@container-normal flex justify-end items-center py-4 mx-16">
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <span>
                  {account === undefined
                    ? 'Loading...'
                    : account?.profile?.name
                      ? `Hello, ${account.profile.name}`
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
