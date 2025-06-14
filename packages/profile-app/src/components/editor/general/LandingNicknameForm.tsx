import React, { useState } from 'react';
import { Button, Input } from '../../ui';
import { useNickname } from '../../../lib/hook/useNickname';
import { Loaded } from 'jazz-tools';
import { OnboardingProfile } from '../../../lib/schema';

type LandingNicknameFormProps = {
  profile: Loaded<typeof OnboardingProfile>;
  triggerSyncIndicator: () => void;
  accountId: string;
};

export function LandingNicknameForm({ profile, triggerSyncIndicator, accountId }: LandingNicknameFormProps) {
  const [nickname, setNickname] = useState(profile.nickname || '');
  const { validation, checkAvailability, updateNickname, isRegistering } = useNickname({ profile, triggerSyncIndicator, accountId });

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNickname(value);
    if (value.trim() === '') {
      checkAvailability('');
    } else {
      checkAvailability(value);
    }
  };

  const handleNicknameBlur = () => {
    const trimmedNickname = nickname.trim();
    if (trimmedNickname && validation.isValid && validation.isAvailable) {
      updateNickname(trimmedNickname).catch((error) => {
        console.error('Failed to update nickname:', error);
      });
    }
  };

  return (
    <div className="flex flex-col items-center text-center gap-6 py-12">
      <h1 className="text-4xl font-sans">profile.jazz.dev</h1>
      <p className="text-lg text-muted-foreground max-w-md">
        The last public profile you will ever need. Build one, share everywhere.
      </p>
      <div className="flex flex-col items-center gap-4 mt-4">
        <div className="relative w-full max-w-md">
          <Input
            type="text"
            id="nickname"
            value={nickname}
            onChange={handleNicknameChange}
            onBlur={handleNicknameBlur}
            placeholder="your_nickname"
            className="w-full"
            disabled={isRegistering}
          />
          {validation.isChecking && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>
        {validation.error && (
          <small className="text-destructive">{validation.error}</small>
        )}
        {validation.message && !validation.error && (
          <small className={validation.isAvailable ? "text-green-600" : "text-destructive"}>
            {validation.message}
          </small>
        )}
        <Button
          size="lg"
          variant="default"
          onClick={() => handleNicknameBlur()}
          disabled={isRegistering || !validation.isValid || !validation.isAvailable}
        >
          Register Handle
        </Button>
      </div>
    </div>
  );
}
