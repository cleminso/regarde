import { useEffect, useState } from 'react';

import { useClerkOnboarding } from '#/lib/onboarding/useClerkOnboarding';
import { NicknameInput } from '../ui/nicknameInput';
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
    // The useClerkOnboarding hook will handle the rest via its useEffect
  };

  const handleAuthClose = () => {
    setShowAuthModal(false);
    setPendingNickname('');
  };

  return (
    <div className="flex flex-col items-center text-center gap-6 py-12">
      <h1 className="text-4xl font-sans">profile.jazz.dev</h1>
      <p className="text-lg text-secondary-foreground max-w-md">
        The last public profile you will ever need. Build one, use it
        everywhere.
      </p>

      <div className="flex flex-col items-center gap-3 mt-4 w-full max-w-lg">
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
      </div>

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
