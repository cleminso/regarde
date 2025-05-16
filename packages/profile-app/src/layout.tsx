import { useAccount, useIsAuthenticated } from 'jazz-react';
import { Link, Outlet } from 'react-router-dom';

import { AuthButton } from './AuthButton.tsx';
import { ThemeToggle } from './components/themeToggle.tsx';

export function AppLayout() {
  const { me } = useAccount();
  const isAuthenticated = useIsAuthenticated();

  return (
    <>
      <header className="bg-background text-card-foreground shadow-lg">
        <nav className="@container-normal flex justify-between items-center py-4 mx-16">
          <div>
            <Link to="/" className="text-xl font-bold mr-6">
              profile.jazz.dev
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <span>
                {me?.profile?.name
                  ? `Hello, ${me.profile.name}`
                  : 'Logged In'}{' '}
              </span>
            ) : (
              <span></span>
            )}
            <ThemeToggle />
            <AuthButton />{' '}
          </div>
        </nav>
      </header>

      <main className="container-full py-6 bg-background">
        <Outlet />
      </main>

      <footer className=""></footer>
    </>
  );
}
