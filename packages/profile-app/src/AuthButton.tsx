'use client';

import { SignInButton } from '@clerk/clerk-react';
import { useAccount, useIsAuthenticated } from 'jazz-tools/react';
import { useNavigate } from 'react-router';

import { Button } from './components/ui/button';
import { OnboardingAccount } from './lib/schema';

export function AuthButton() {
  const { logOut } = useAccount(OnboardingAccount);
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();

  function handleLogOut() {
    logOut();
    navigate('/');
  }

  if (isAuthenticated) {
    return (
      <Button variant="secondary" size="lg" onClick={handleLogOut}>
        Log out
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      <SignInButton />
    </div>
  );
}
