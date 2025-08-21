'use client';

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

import { CustomAuthModal } from './components/onboarding/customAuthModal';
import { Button } from './components/ui/button';
import { useMyJazz } from './lib/account/useMyJazz';
import { useRegistrationKey } from './lib/account/useRegistrationKey';

export function AuthButton() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const { logOut, isAuthenticated } = useMyJazz();
  const { getValidKey, isAccountReady } = useRegistrationKey();

  const navigate = useNavigate();
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

  function handleModeChange(newMode: 'login' | 'register') {
    setAuthMode(newMode);
  }

  if (!isAuthenticated) {
    return (
      <>
        <Button
          variant="outline"
          onClick={() => {
            setAuthMode('login');
            setShowAuthModal(true);
          }}
        >
          Login
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setAuthMode('register');
            setShowAuthModal(true);
          }}
        >
          Register
        </Button>
        <CustomAuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          mode={authMode}
          onModeChange={handleModeChange}
        />
      </>
    );
  }

  return (
    <Button variant="outline" onClick={handleLogOut}>
      Logout
    </Button>
  );
}
