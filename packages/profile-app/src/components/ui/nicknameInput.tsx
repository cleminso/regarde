import { Loaded } from 'jazz-tools';
import { Loader2 } from 'lucide-react';
import React, { useEffect } from 'react';

import { useNicknameValidation } from '../../lib/hook/useNickname';
import { OnboardingProfile } from '../../lib/schema';
import { Button, Input } from './';

interface NicknameInputProps {
  value: string;
  onChange: (value: string) => void;
  profile?: Loaded<typeof OnboardingProfile>;
  isProcessing?: boolean;
  disabled?: boolean;
  placeholder?: string;

  onAction?: (value: string) => void;
  actionText: string;
  onView?: (value: string) => void;

  errorDisplay?: {
    position: 'below' | 'inline';
    showRequiredMessage?: boolean;
    externalError?: string | null;
  };

  label?: {
    text: string;
    required?: boolean;
  };
}

export function NicknameInput({
  value,
  onChange,
  profile,
  isProcessing = false,
  disabled = false,
  placeholder = 'your_name',
  onAction,
  actionText,
  onView,
  errorDisplay = { position: 'below' },
  label,
}: NicknameInputProps) {
  const { status, errorMessage, checkAvailability } = useNicknameValidation({
    profile,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      checkAvailability(value);
    }, 500);
    return () => clearTimeout(timer);
  }, [value, checkAvailability]);

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const input = e.target;
    setTimeout(() => {
      input.setSelectionRange(input.value.length, input.value.length);
    }, 0);
  };

  const renderButton = () => {
    if (isProcessing) {
      return (
        <Button disabled size="sm">
          <Loader2 size={16} className="animate-spin" />
        </Button>
      );
    }

    const trimmed = value.trim();
    if (!trimmed) return null;

    const isUnchanged = trimmed === (profile?.nickname || '');

    if (status === 'available') {
      if (isUnchanged) {
        return (
          <Button variant="outline" size="sm" disabled>
            Current
          </Button>
        );
      }

      if (onAction) {
        return (
          <Button variant="success" size="sm" onClick={() => onAction(trimmed)}>
            {actionText}
          </Button>
        );
      }
    }

    if (status === 'taken') {
      if (onView) {
        return (
          <Button variant="view" size="sm" onClick={() => onView(trimmed)}>
            View
          </Button>
        );
      }

      return (
        <Button variant="outline" size="sm" disabled>
          Taken
        </Button>
      );
    }

    if (status === 'invalid') {
      return (
        <Button variant="destructive" size="sm" disabled>
          Invalid
        </Button>
      );
    }

    return null;
  };

  const renderError = () => {
    const trimmed = value.trim();

    if (errorDisplay.externalError) {
      return (
        <small className="text-destructive">{errorDisplay.externalError}</small>
      );
    }

    if (!trimmed && errorDisplay.showRequiredMessage) {
      return <small className="text-destructive">Nickname is required.</small>;
    }

    if (trimmed && status === 'invalid' && errorMessage) {
      return <small className="text-destructive">{errorMessage}</small>;
    }

    return null;
  };

  return (
    <div className="space-y-3">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-sans block text-foreground">
            {label.text}
            {label.required && <sup>*</sup>}
          </label>
          {errorDisplay.position === 'inline' && renderError()}
        </div>
      )}

      <div className="flex items-center bg-background border border-border rounded-md overflow-hidden w-full">
        <div className="flex items-center px-3 py-3 bg-muted border-r border-border">
          <span className="text-sm text-foreground">profile.jazz.dev/</span>
        </div>
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="border-0 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent flex-1"
          disabled={disabled || isProcessing}
        />
        <div className="flex items-center px-2 min-w-[100px] justify-end">
          {renderButton()}
        </div>
      </div>

      {errorDisplay.position === 'below' && (
        <div className="h-6 text-sm">{renderError()}</div>
      )}
    </div>
  );
}
