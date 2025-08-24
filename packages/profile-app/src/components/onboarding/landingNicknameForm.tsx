import { useEffect, useState } from 'react';

import { useClerkOnboarding } from '#/lib/onboarding/useClerkOnboarding';
import { NicknameInput } from '../onboarding/nicknameInput';
import { CustomAuthModal } from './customAuthModal';

export function LandingNicknameForm() {
  const [nickname, setNickname] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingNickname, setPendingNickname] = useState('');

  const onboarding = useClerkOnboarding({
    customAuthCallback: (nickname: string) => {
      setPendingNickname(nickname);
      setShowAuthModal(true);
    },
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      onboarding.checkAvailability(nickname);
    }, 500);
    return () => clearTimeout(timer);
  }, [nickname, onboarding.checkAvailability]);

  const handleAuthRegistered = async (_nickname: string) => {
    setShowAuthModal(false);
    setPendingNickname('');
  };

  const handleAuthClose = () => {
    setShowAuthModal(false);
    setPendingNickname('');
  };

  // Show loading state for authenticated users
  if (onboarding.isAuthenticated && !onboarding.accountId) {
    return <div className="text-muted-foreground">Loading account...</div>;
  }

  // Show form for unauthenticated users or authenticated users without nickname
  if (!onboarding.isAuthenticated || !onboarding.hasExistingNickname) {
    return (
      <div className="w-full max-w-lg mx-auto">
        <NicknameInput
          value={nickname}
          onChange={setNickname}
          isProcessing={onboarding.isProcessing}
          onAction={onboarding.register}
          actionText="Register"
          onView={onboarding.view}
          validationStatus={onboarding.validationStatus}
          validationError={onboarding.validationError}
          currentNickname={onboarding.currentNickname}
          errorDisplay={{
            position: 'below',
            externalError: onboarding.error,
          }}
        />

        <CustomAuthModal
          isOpen={showAuthModal}
          onClose={handleAuthClose}
          mode="register"
          nicknameContext={{
            nickname: pendingNickname,
            onRegistered: handleAuthRegistered,
          }}
        />
      </div>
    );
  }

  // Show redirect message for authenticated users with nickname
  return (
    <div className="text-muted-foreground">
      Redirecting to your profile editor...
    </div>
  );
}
