'use client';

import { SignInButton } from '@clerk/clerk-react';
import { useAccount, useIsAuthenticated } from 'jazz-tools/react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';

import { Button } from './components/ui/button';
import { useRegistrationKey } from './lib/hook/useRegistrationKey';
import { OnboardingAccount } from './lib/schema';

export function AuthButton() {
  const { logOut } = useAccount(OnboardingAccount, {
    resolve: { profile: true },
  });
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();
  const { getValidKey, isAccountLoaded } = useRegistrationKey();

  useEffect(() => {
    if (isAuthenticated && isAccountLoaded) {
      getValidKey()
        .then((key) => {
          if (key) {
            console.log('Valid registration key confirmed');
          } else {
            console.error('Failed to obtain valid registration key');
          }
        })
        .catch((error) => {
          console.error('Error ensuring valid key:', error);
        });
    }
  }, [isAuthenticated, isAccountLoaded, getValidKey]);

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
