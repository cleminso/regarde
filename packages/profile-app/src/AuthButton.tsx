'use client';

import { useAccount, usePasskeyAuth } from 'jazz-react';
import { useNavigate } from 'react-router-dom';

import { Button } from './components/ui/button';
import { OnboardingAccount } from './lib/schema';
import { APPLICATION_NAME } from './main';

export function AuthButton() {
  const { logOut } = useAccount(OnboardingAccount);
  const navigate = useNavigate();

  const auth = usePasskeyAuth({
    appName: APPLICATION_NAME,
  });

  function handleLogOut() {
    logOut();
    navigate('/');
  }

  if (auth.state === 'signedIn') {
    return (
      <Button variant="secondary" size="lg" onClick={handleLogOut}>
        Log out
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          auth.logIn().then(() => {
            navigate('/profile');
          });
        }}
      >
        Log in
      </Button>
    </div>
  );
}
