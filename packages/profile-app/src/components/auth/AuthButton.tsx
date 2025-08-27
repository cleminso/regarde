'use client';

import { useEffect, useRef, useState } from 'react';

import { useRegistrationKey } from '#/lib/account/useRegistrationKey';
import { logger } from '#/lib/utils/logger';
import { useMyJazz } from '../../lib/account/useMyJazz';
import { CustomAuthModal } from '../onboarding/customAuthModal';
import { Button } from '../ui/button';

export function AuthButton() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const { logOut, isAuthenticated } = useMyJazz();
  const { getValidKey, isAccountReady } = useRegistrationKey();

  const keyInitialized = useRef(false);

  useEffect(() => {
    if (isAuthenticated && isAccountReady && !keyInitialized.current) {
      keyInitialized.current = true;

      getValidKey()
        .then((key) => {
          if (key) {
          } else {
            logger.error('Failed to obtain valid registration key');
          }
        })
        .catch((error) => {
          logger.error('Error ensuring valid key:', error);
        });
    }
  }, [isAuthenticated, isAccountReady, getValidKey]);

  function handleLogOut() {
    keyInitialized.current = false;
    logOut();
  }

  function handleModeChange(newMode: 'login' | 'register') {
    setAuthMode(newMode);
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setAuthMode('login');
            setShowAuthModal(true);
          }}
        >
          LOGIN
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setAuthMode('register');
            setShowAuthModal(true);
          }}
        >
          REGISTER
        </Button>
        <CustomAuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          mode={authMode}
          onModeChange={handleModeChange}
        />
      </div>
    );
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleLogOut}>
      LOGOUT
    </Button>
  );
}
