import { useEffect, useState } from 'react';
import { useNickname } from '../../lib/nickname/useNickname';
import { NicknameInput } from '../ui/nicknameInput';

export function LandingNicknameForm() {
  const [nickname, setNickname] = useState('');
  const nicknameHook = useNickname();

  // Clear errors when nickname changes
  useEffect(() => {
    if (nicknameHook.error) {
      nicknameHook.clearError();
    }
  }, [nickname, nicknameHook.error, nicknameHook.clearError]);

  // Check availability when nickname changes
  useEffect(() => {
    const timer = setTimeout(() => {
      nicknameHook.checkAvailability(nickname);
    }, 500);
    return () => clearTimeout(timer);
  }, [nickname, nicknameHook.checkAvailability]);

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
          isProcessing={nicknameHook.isProcessing}
          onAction={nicknameHook.register}
          actionText="Register"
          onView={nicknameHook.view}
          validationStatus={nicknameHook.validationStatus}
          validationError={nicknameHook.validationError}
          currentNickname={nicknameHook.currentNickname}
          errorDisplay={{
            position: 'below',
            externalError: nicknameHook.error,
          }}
        />
      </div>
    </div>
  );
}
