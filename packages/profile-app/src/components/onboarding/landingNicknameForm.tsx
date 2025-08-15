import { useEffect, useState } from 'react';

import { useClerkOnboarding } from '../../lib/onboarding/useClerkOnboarding';
import { NicknameInput } from '../ui/nicknameInput';

export function LandingNicknameForm() {
  const [nickname, setNickname] = useState('');
  const onboarding = useClerkOnboarding();

  useEffect(() => {
    const timer = setTimeout(() => {
      onboarding.checkAvailability(nickname);
    }, 500);
    return () => clearTimeout(timer);
  }, [nickname, onboarding.checkAvailability]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onboarding.checkAvailability(nickname);
    }, 500);
    return () => clearTimeout(timer);
  }, [nickname, onboarding.checkAvailability]);

  return (
    <div className="flex flex-col items-center text-center gap-6 py-12">
      <h1 className="text-4xl font-sans">profile.jazz.dev</h1>
      <p className="text-lg text-secondary-foreground max-w-md">
        The last public profile you will ever need. Build one, share everywhere.
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
    </div>
  );
}
