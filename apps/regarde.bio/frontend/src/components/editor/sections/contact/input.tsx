import React from "react";

import { Input } from "../../../ui";

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
    <div className="border-input bg-background flex items-center overflow-hidden rounded-md border">
      <div className="bg-muted border-border flex items-center border-r px-3 py-3">
        <div className="text-muted-foreground mr-2 h-4 w-4 shrink-0">{icon}</div>
        <span className="text-muted-foreground text-sm">{prefix}</span>
      </div>
      <Input
        type="text"
        id={id}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        onFocus={handleFocus}
        placeholder={placeholder}
        className="flex-1 border-0 bg-transparent"
      />
    </div>
  );
}
