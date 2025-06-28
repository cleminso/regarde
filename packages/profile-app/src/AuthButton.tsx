'use client';

import { SignInButton } from '@clerk/clerk-react';
import { useAccount, useIsAuthenticated } from 'jazz-tools/react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';

import { Button } from './components/ui/button';
import { useRegistrationKey } from './lib/hook/useRegistrationKey';
import { OnboardingAccount } from './lib/schema';

export function AuthButton() {
  const { logOut } = useAccount(OnboardingAccount);
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();
  const { generateAndStore, currentKey, isAccountLoaded } =
    useRegistrationKey();

  useEffect(() => {
    if (isAuthenticated && isAccountLoaded && !currentKey) {
      console.log('User authenticated, generating registration key...');
      generateAndStore()
        .then((key) => {
          if (key) {
            console.log('Registration key generated successfully:', key);
          } else {
            console.error('Failed to generate registration key');
          }
        })
        .catch((error) => {
          console.error('Error generating registration key:', error);
        });
    }
  }, [isAuthenticated, isAccountLoaded, currentKey, generateAndStore]);

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
