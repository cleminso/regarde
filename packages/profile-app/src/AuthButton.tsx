'use client';

import { useAccount, useIsAuthenticated } from 'jazz-tools/react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

import { CustomAuthModal } from './components/onboarding/customAuthModal';
import { Button } from './components/ui/button';
import { useRegistrationKey } from './lib/account/useRegistrationKey';
import { OnboardingAccount } from './lib/schema';

export function AuthButton() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { logOut } = useAccount(OnboardingAccount, {
    resolve: { 
      profile: {
        'profile.jazz.dev': {
          userHandle: true,
        }
      }
    },
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
      <>
        <Button variant="outline" onClick={() => setShowAuthModal(true)}>
          Sign In
        </Button>
        <CustomAuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </>
    );
  }

  return (
    <Button variant="outline" onClick={handleLogOut}>
      Sign Out
    </Button>
  );
}
