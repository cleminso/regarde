import { useEffect, useState } from 'react';

import { useNicknameRegistration } from '../../lib/hook/useNickname';
import { NicknameInput } from '../ui/nicknameInput';

export function LandingNicknameForm() {
  const [nickname, setNickname] = useState('');

  const { isProcessing, error, register, view, clearError } =
    useNicknameRegistration();

  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [nickname, error, clearError]);

  const handleRegister = async (value: string) => {
    await register(value);
  };

  const handleView = (value: string) => {
    view(value);
  };

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
          isProcessing={isProcessing}
          onAction={handleRegister}
          actionText="Register"
          onView={handleView}
          errorDisplay={{
            position: 'below',
            externalError: error,
          }}
        />
      </div>
    </div>
  );
}
