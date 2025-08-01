'use client';

import { SignInButton } from '@clerk/clerk-react';
import { useAccount, useIsAuthenticated } from 'jazz-tools/react';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';

import { Button } from './components/ui/button';
import { useRegistrationKey } from './lib/account/useRegistrationKey';
import { OnboardingAccount } from './lib/schema';

export function AuthButton() {
  const { logOut } = useAccount(OnboardingAccount, {
    resolve: { profile: true },
  });
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();
  const { getValidKey, isAccountReady } = useRegistrationKey();
  const keyInitialized = useRef(false);

  useEffect(() => {
    if (isAuthenticated && isAccountReady && !keyInitialized.current) {
      keyInitialized.current = true;
      
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
  }, [isAuthenticated, isAccountReady, getValidKey]);

  function handleLogOut() {
    keyInitialized.current = false;
    logOut();
    navigate('/');
  }

  if (!isAuthenticated) {
    return (
      <SignInButton mode="modal">
        <Button variant="outline">Sign In</Button>
      </SignInButton>
    );
  }

  return (
    <Button variant="outline" onClick={handleLogOut}>
      Sign Out
    </Button>
  );
}
