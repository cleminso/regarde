import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Loader2 } from 'lucide-react';

import { AuthButton } from './AuthButton.tsx';
import { LandingNicknameForm } from './components/onboarding/landingNicknameForm.tsx';
import { ThemeToggle } from './components/themeToggle.tsx';
import { useOnboardingAccount } from './lib/account/useAccount';
import { createNicknameUrl } from './lib/utils.ts';

export function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const account = useOnboardingAccount();

  // Add loading state for transition
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (!account.isAuthenticated) return;
    
    if (account.hasExistingNickname) {
      console.log(`User "${account.currentNickname}" is authenticated...`);
      setIsTransitioning(true);
      navigate(createNicknameUrl(account.currentNickname, '/edit'));
    } else if (location.pathname !== '/') {
      console.log('User is authenticated but has no nickname, remaining on landing page.');
      navigate('/', { replace: true });
    }
  }, [account.isAuthenticated, account.hasExistingNickname, account.currentNickname, navigate, location.pathname]);

  // Show loading during transition
  if (account.isAuthenticated && account.hasExistingNickname && isTransitioning) {
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
        {account.account === undefined && <div>Loading account...</div>}
        {account.account === null && <div>Account not accessible</div>}
        {account.account && (!account.isAuthenticated || !account.hasExistingNickname) && (
          <LandingNicknameForm />
        )}
        {account.isAuthenticated && account.hasExistingNickname && (
          <div>Redirecting to your profile editor...</div>
        )}
      </main>
    </div>
  );
}

export default App;
