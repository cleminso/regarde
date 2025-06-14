import { useAccount, useIsAuthenticated, usePasskeyAuth } from 'jazz-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';

import { AuthButton } from './AuthButton.tsx';
import NicknameEditor from './components/NicknameEditor.tsx';
import { ThemeToggle } from './components/themeToggle.tsx';
import { Button } from './components/ui/button.tsx';
import { fetchUserDetailsByAccountId } from './lib/api.ts';
import { OnboardingAccount } from './lib/schema.ts';
import { APPLICATION_NAME } from './main.tsx';

export function App() {
  const { me } = useAccount(OnboardingAccount, {
    resolve: { profile: true, root: true },
  });
  const accountId = me?.id;
  const isAuthenticated = useIsAuthenticated();
  const navigate = useNavigate();
  const [currentNickname, setCurrentNickname] = useState<string | undefined>(
    undefined,
  );
  const [isLoadingNickname, setIsLoadingNickname] = useState(false);

  const auth = usePasskeyAuth({
    appName: APPLICATION_NAME,
  });

  useEffect(() => {
    if (isAuthenticated && accountId) {
      setIsLoadingNickname(true);
      fetchUserDetailsByAccountId(accountId)
        .then((userDetails) => {
          setCurrentNickname(userDetails.nickname);
          setIsLoadingNickname(false);
        })
        .catch((err) => {
          console.error('Failed to fetch user details', err);
          setIsLoadingNickname(false);
        });
    } else {
      // Clear nickname if user logs out or accountId is not available
      setCurrentNickname(undefined);
    }
  }, [isAuthenticated, accountId]);

  const handleLogin = async () => {
    try {
      await auth.logIn();
      // navigate('/profile');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleCreateProfile = async () => {
    try {
      await auth.signUp('');
      // navigate('/edit');
    } catch (error) {
      console.error('Sign up failed:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      // navigate('/profile', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Determine what to display based on auth state and nickname loading
  // This logic is simplified; actual app might have routes for /profile
  // For now, NicknameEditor is added to the authenticated view.
  const renderAuthenticatedContent = () => {
    if (!accountId) return <p>Account details are not available yet.</p>;
    if (isLoadingNickname) {
      return <p>Loading nickname details...</p>;
    }
    return (
      <section
        style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc' }}
      >
        <h2>Manage Your Nickname</h2>
        <NicknameEditor
          accountId={accountId}
          currentNickname={currentNickname}
        />
      </section>
    );
  };

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

      <main className="container mt-16 flex flex-col">
        {isAuthenticated && accountId ? (
          <div className="content-center">
            <h1 className="text-center">
              Welcome{me?.profile?.name ? <>, {me.profile.name}</> : ''}!
            </h1>
            {renderAuthenticatedContent()}
          </div>
        ) : (
          <div className="flex flex-col items-center text-center gap-6 py-12">
            <h1 className="text-4xl font-sans">profile.jazz.dev</h1>
            <p className="text-lg text-muted-foreground max-w-md">
              The last public profile you will ever need. Build one, share
              everywhere.
            </p>
            <div className="flex gap-4 mt-4">
              <Button
                size="lg"
                variant="outline"
                onClick={handleLogin}
                className="border-border"
              >
                Log in
              </Button>
              <Button size="lg" variant="default" onClick={handleCreateProfile}>
                Register Handle
              </Button>
            </div>
            {auth.state !== 'signedIn' && <p>Loading authentication...</p>}
          </div>
        )}
      </main>
    </>
  );
}

export default App;
