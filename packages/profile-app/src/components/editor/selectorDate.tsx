import React from 'react';

import { Button } from '../ui';

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
  buttonClassName = 'w-full justify-start font-normal h-9 py-2 px-3 text-sm font-sans',
  selectClassName = 'absolute inset-0 w-full h-full opacity-0 cursor-pointer',
  wrapperClassName = 'relative w-full',
}: SelectorDateProps) {
  return (
    <div className={wrapperClassName}>
      <Button
        variant="outline"
        className={buttonClassName}
        aria-hidden="true"
        tabIndex={-1}
      >
        {buttonDisplayValue}
      </Button>
      <select
        id={id}
        value={value}
        onChange={onChange}
        className={selectClassName}
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
