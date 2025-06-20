import React from 'react';

import { Input } from '../../ui';

export type ContactInputProps = {
  id: string;
  icon: React.ReactNode;
  prefix: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

export function ContactInput({
  id,
  icon,
  prefix,
  value,
  onChange,
  placeholder,
}: ContactInputProps) {
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const input = e.target;
    setTimeout(() => {
      input.setSelectionRange(input.value.length, input.value.length);
    }, 0);
  };

  return (
    <div className="flex items-center bg-background border border-border rounded-lg overflow-hidden">
      <div className="flex items-center px-3 py-3 bg-muted border-r border-border">
        <div className="w-4 h-4 mr-2 flex-shrink-0">{icon}</div>
        <span className="text-sm text-muted-foreground font-mono">
          {prefix}
        </span>
      </div>
      <Input
        type="text"
        id={id}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onChange(e.target.value)
        }
        onFocus={handleFocus}
        placeholder={placeholder}
        className="border-0 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent flex-1"
      />
    </div>
  );
}
