import React from 'react';

import { cn } from '../../lib/utils.ts';
import { Button } from '../ui/button.tsx';

type SelectorDateProps = {
  id: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholderOption: { value: string; label: string; disabled?: boolean };
  buttonDisplayValue: string;
  buttonClassName?: string;
  selectClassName?: string;
  wrapperClassName?: string;
};

const currentYear = new Date().getFullYear();
const yearOptions: string[] = [];
for (let i = 0; i < 50; i++) {
  yearOptions.push((currentYear - i).toString());
}

export function SelectorDate({
  id,
  value,
  onChange,
  placeholderOption,
  buttonDisplayValue,
  buttonClassName,
  selectClassName,
  wrapperClassName,
}: SelectorDateProps) {
  return (
    <div className={cn('relative w-full', wrapperClassName)}>
      <Button
        variant="outline"
        size="lg"
        className={cn('w-full bg-background justify-start', buttonClassName)}
        aria-hidden="true"
        tabIndex={-1}
      >
        {buttonDisplayValue}
      </Button>
      <select
        id={id}
        value={value}
        onChange={onChange}
        className={cn(
          'absolute inset-0 w-full h-full opacity-0 cursor-pointer',
          selectClassName,
        )}
      >
        <option
          value={placeholderOption.value}
          disabled={placeholderOption.disabled === true}
        >
          {placeholderOption.label}
        </option>
        {yearOptions.map((year) => (
          <option key={`${id}-option-${year}`} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  );
}
