import { useAccount, useIsAuthenticated, usePasskeyAuth } from 'jazz-react';
import { useEffect } from 'react'; // Removed useState, removed unused imports
import { Link, useNavigate } from 'react-router';

import { AuthButton } from './AuthButton.tsx';
import { LandingNicknameForm } from './components/editor/general/LandingNicknameForm.tsx';
import { ThemeToggle } from './components/themeToggle.tsx';
import { Button } from './components/ui/button.tsx';
import { OnboardingAccount } from './lib/schema.ts';
import { APPLICATION_NAME } from './main.tsx';

export function App() {
  const { me } = useAccount(OnboardingAccount, {
    resolve: { profile: true, root: true },
  });

  const profile = me?.profile;

  const isAuthenticated = useIsAuthenticated();
  const navigate = useNavigate();

  const auth = usePasskeyAuth({
    appName: APPLICATION_NAME,
  });

  const handleLogin = async () => {
    try {
      console.log('Login button clicked, triggering login...');
      await auth.logIn();
      console.log(
        'auth.logIn completed. Expecting useEffect to handle navigation...',
      );
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated && profile?.nickname) {
      console.log(
        `User "${profile.nickname}" is authenticated, navigating to edit page.`,
      );
      navigate(`/${profile.nickname}/edit`, { replace: true });
    } else if (isAuthenticated && !profile?.nickname) {
      console.log(
        'User is authenticated but has no nickname, remaining on landing page.',
      );
      if (location.pathname !== '/') {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, profile?.nickname, navigate]);

  return (
    <>
      <header className="bg-background text-card-foreground">
        <nav className="@container-normal flex justify-between items-center py-4 mx-16">
          <div>
            <Link to="/" className="text-lg font-sans mr-6">
              profile.jazz.dev
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <AuthButton />
            <ThemeToggle />
            {!isAuthenticated && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleLogin}
                className="border-border"
              >
                Log in
              </Button>
            )}
            {isAuthenticated && profile?.nickname && (
              <span>Hello, @{profile.nickname}</span>
            )}
          </div>
        </nav>
      </header>

      <main className="container mt-16 flex flex-col items-center text-center gap-6 py-12">
        {' '}
        {(!isAuthenticated || (isAuthenticated && !profile?.nickname)) && (
          <LandingNicknameForm />
        )}
        {isAuthenticated && profile?.nickname && (
          <div>Redirecting to your profile editor...</div>
        )}
      </main>
    </>
  );
}

export default App;
