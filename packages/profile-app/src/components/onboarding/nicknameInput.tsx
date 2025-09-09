import { JazzAppProfile } from '@onboarding.jazz/shared-schemas';
import { Loaded } from 'jazz-tools';
import { Loader2 } from 'lucide-react';
import React, { useCallback } from 'react';

import { normalizeNickname } from '../../lib/utils/utils';
import { Button, Input } from '../ui';

type ValidationStatus =
  | 'empty'
  | 'invalid'
  | 'checking'
  | 'available'
  | 'taken'
  | 'reserved';

interface NicknameInputProps {
  value: string;
  onChange: (value: string) => void;
  profile?: Loaded<typeof JazzAppProfile>;
  isProcessing?: boolean;
  disabled?: boolean;
  placeholder?: string;
  onBlurRestore?: () => void;

  onAction?: (value: string) => void;
  actionText: string;
  onView?: (value: string) => void;

  // Simplified validation props
  validationStatus?: ValidationStatus;
  validationError?: string;
  currentNickname?: string;

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
  placeholder = 'your_nickname',
  onBlurRestore,
  onAction,
  actionText,
  onView,
  validationStatus = 'empty',
  validationError = '',
  currentNickname = '',
  errorDisplay = { position: 'below' },
  label,
}: NicknameInputProps) {
  const hasProfile = profile !== undefined;

  // Keyboard shortcuts handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const isAlt = e.altKey;

      if (isCmdOrCtrl && e.key === 'Enter' && !e.shiftKey && !isAlt) {
        e.preventDefault();
        if (validationStatus === 'available' && onAction && !isProcessing) {
          const isUnchanged = hasProfile && value === currentNickname;
          if (!isUnchanged) {
            onAction(value);
          }
        }
      }

      if (isAlt && e.key === 'Enter' && !e.shiftKey && !isCmdOrCtrl) {
        e.preventDefault();
        if (validationStatus === 'taken' && onView) {
          onView(value);
        }
      }
    },
    [
      validationStatus,
      onAction,
      onView,
      value,
      isProcessing,
      hasProfile,
      currentNickname,
    ],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const normalized = normalizeNickname(e.target.value);
    onChange(normalized);
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const input = e.target;
    setTimeout(() => {
      input.setSelectionRange(input.value.length, input.value.length);
    }, 0);
  };

  const handleInputBlur = () => {
    if (!value.trim() && onBlurRestore) {
      onBlurRestore();
    }
  };

  const renderButton = () => {
    if (isProcessing) {
      return (
        <Button disabled size="sm" aria-label="Processing">
          <Loader2 size={16} className="animate-spin" />
        </Button>
      );
    }

    const isUnchanged = hasProfile && value === currentNickname;

    if (validationStatus === 'checking') {
      return (
        <Button disabled size="sm" aria-label="Checking availability">
          <Loader2 size={16} className="animate-spin" />
        </Button>
      );
    }

    if (validationStatus === 'available') {
      if (isUnchanged) {
        return (
          <Button
            variant="ghost"
            size="sm"
            disabled
            aria-label="Current nickname"
          >
            Current
          </Button>
        );
      }

      if (onAction) {
        return (
          <Button
            variant="success"
            size="sm"
            onClick={() => onAction(value)}
            aria-label={`${actionText} nickname (Cmd+Enter)`}
            title="Cmd+Enter"
          >
            {actionText}
          </Button>
        );
      }
    }

    if (validationStatus === 'taken') {
      if (onView) {
        return (
          <Button
            variant="view"
            size="sm"
            onClick={() => onView(value)}
            aria-label={`View profile (Alt+Enter)`}
            title="Alt+Enter"
          >
            View
          </Button>
        );
      }

      return (
        <Button
          variant="destructive"
          size="sm"
          disabled
          aria-label="Nickname is taken"
        >
          Taken
        </Button>
      );
    }

    if (validationStatus === 'reserved') {
      return (
        <Button
          variant="destructive"
          size="sm"
          disabled
          aria-label="Nickname is reserved"
        >
          Reserved
        </Button>
      );
    }

    if (validationStatus === 'invalid') {
      return (
        <Button
          variant="destructive"
          size="sm"
          disabled
          aria-label="Invalid nickname format"
        >
          Invalid
        </Button>
      );
    }

    return null;
  };

  const renderError = () => {
    if (errorDisplay.externalError) {
      return (
        <small className="text-destructive">{errorDisplay.externalError}</small>
      );
    }

    if (!value && errorDisplay.showRequiredMessage) {
      return <small className="text-destructive">Nickname is required.</small>;
    }

    if (value && validationStatus === 'reserved') {
      return (
        <small className="text-foreground">
          Reserved -{' '}
          <a
            href="https://x.com/cleminso"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            Contact support
          </a>{' '}
          if you believe you should have access to this nickname.
        </small>
      );
    }

    if (value && validationStatus === 'invalid' && validationError) {
      return <small className="text-destructive">{validationError}</small>;
    }

    return null;
  };

  const isInputDisabled = disabled || isProcessing;

  return (
    <div className="space-y-3">
      {label && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-sans block text-foreground">
              {label.text}
              {label.required && <sup>*</sup>}
            </label>
          </div>
          {errorDisplay.position === 'inline' && (
            <div className="text-sm">{renderError()}</div>
          )}
        </div>
      )}

      <div className="space-y-2 sm:space-y-0">
        <div className="text-sm text-muted-foreground font-mono sm:hidden">
          regarde.dev/
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-transparent border border-input rounded-md overflow-hidden w-full">
          {/* Domain prefix - show inline on desktop */}
          <div className="hidden sm:flex items-center px-3 py-3 bg-secondary border-r border-border">
            <span className="text-sm text-foreground">regarde.dev/</span>
          </div>

          <div className="flex items-center flex-1">
            <Input
              type="text"
              value={value}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="border-0 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent flex-1 px-3 py-3"
              disabled={isInputDisabled}
              aria-describedby={
                errorDisplay.position === 'below' ? 'nickname-error' : undefined
              }
            />

            <div className="flex items-center px-3 py-1 justify-end min-w-[80px] sm:min-w-[100px]">
              {renderButton()}
            </div>
          </div>
        </div>
      </div>

      {errorDisplay.position === 'below' && (
        <div className="h-6 text-sm" id="nickname-error">
          {renderError()}
        </div>
      )}
    </div>
  );
}
