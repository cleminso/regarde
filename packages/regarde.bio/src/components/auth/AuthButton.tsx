'use client';

import { useEffect, useRef, useState } from 'react';

import { useRegardeAuth } from '#/lib/account/useRegistrationToken';
import { logger } from '#/lib/utils/logger';
import { useMyRegardeAccount } from '../../lib/account/useMyRegardeAccount';
import { CustomAuthModal } from '../onboarding/customAuthModal';
import { Button } from '../ui/button';

export function AuthButton() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const { logOut, isAuthenticated } = useMyRegardeAccount();
  const { getValidKey, isAccountReady } = useRegardeAuth();

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
      <div className="flex items-center gap-1 sm:gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="touch-hitbox text-xs sm:text-sm px-2 sm:px-3"
          onClick={() => {
            setAuthMode('login');
            setShowAuthModal(true);
          }}
        >
          <span className="hidden sm:inline">LOGIN</span>
          <span className="sm:hidden">LOGIN</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="touch-hitbox text-xs sm:text-sm px-2 sm:px-3"
          onClick={() => {
            setAuthMode('register');
            setShowAuthModal(true);
          }}
        >
          <span className="hidden sm:inline">REGISTER</span>
          <span className="sm:hidden">REGISTER</span>
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
