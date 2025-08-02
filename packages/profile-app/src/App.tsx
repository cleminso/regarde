import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';

import { AuthButton } from './AuthButton.tsx';
import { LandingNicknameForm } from './components/onboarding/landingNicknameForm.tsx';
import { ThemeToggle } from './components/themeToggle.tsx';
import { useOnboarding } from './lib/onboarding/useOnboarding';
import { createNicknameUrl } from './lib/utils.ts';

export function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const onboarding = useOnboarding();

  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (!onboarding.isAuthenticated) return;

    if (onboarding.hasExistingNickname) {
      console.log(`User "${onboarding.currentNickname}" is authenticated...`);
      setIsTransitioning(true);
      navigate(createNicknameUrl(onboarding.currentNickname, '/edit'));
    } else if (location.pathname !== '/') {
      console.log(
        'User is authenticated but has no nickname, remaining on landing page.',
      );
      navigate('/', { replace: true });
    }
  }, [
    onboarding.isAuthenticated,
    onboarding.hasExistingNickname,
    onboarding.currentNickname,
    navigate,
    location.pathname,
  ]);

  if (
    onboarding.isAuthenticated &&
    onboarding.hasExistingNickname &&
    isTransitioning
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4" size={32} />
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="font-semibold">
            Jazz Profile
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <AuthButton />
          </div>
        </div>
      </header>

      <main className="container mt-16 flex flex-col items-center text-center gap-6 py-12">
        {!onboarding.accountId && <div>Loading account...</div>}
        {onboarding.accountId &&
          (!onboarding.isAuthenticated || !onboarding.hasExistingNickname) && (
            <LandingNicknameForm />
          )}
        {onboarding.isAuthenticated && onboarding.hasExistingNickname && (
          <div>Redirecting to your profile editor...</div>
        )}
      </main>
    </div>
  );
}

export default App;
