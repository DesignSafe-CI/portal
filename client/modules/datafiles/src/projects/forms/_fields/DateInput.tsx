import React from 'react';
import { Button, DatePicker, DatePickerProps } from 'antd';
import dayjs from 'dayjs';

/* Date input that exposes the value as ISO timestamp instead of dayJS object  */
export const DateInput: React.FC<
  {
    value?: string;
    onChange?: (value?: string) => void;
  } & DatePickerProps
> = ({ value, onChange, ...props }) => {
  return (
    <>
      <DatePicker
        value={value ? dayjs(value) : undefined}
        placeholder="mm/dd/yyyy"
        onChange={(v) => onChange && onChange(v ? v.toISOString() : undefined)}
        format="MM/DD/YYYY"
        {...props}
        style={{ width: '100%', minWidth: '200px', ...props.style }}
      />
      {/* Explicit clear button is needed for keyboard usability */}
      <Button
        hidden={props.disabled || !value}
        type="link"
        onClick={() => onChange && onChange(undefined)}
        disabled={props.disabled}
      >
        Clear Date
      </Button>
    </>
  );
};
