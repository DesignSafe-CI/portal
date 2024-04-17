import { Select, SelectProps } from 'antd';
import React, { useState } from 'react';

type DropdownValue = { id: string; name: string };
export const DropdownSelect: React.FC<{
  maxCount?: number;
  options: SelectProps['options'];
  value?: DropdownValue[];
  onChange?: (value: DropdownValue[]) => void;
}> = ({ value, onChange, options, maxCount }) => {
  const handleChange = (newVal: { label?: string; value: string }[]) => {
    const formValue = newVal.map((v) =>
      v.label ? { id: v.value, name: v.label } : { id: 'other', name: v.value }
    );

    onChange && onChange(formValue);
  };

  const getValue = (
    formVal?: DropdownValue[]
  ): { label?: string; value: string }[] | undefined => {
    return formVal?.map((v) =>
      v.id === 'other'
        ? { label: undefined, value: v.name }
        : { label: v.name, value: v.id }
    );
  };

  return (
    <Select
      virtual={false}
      placement="bottomLeft"
      maxCount={maxCount}
      value={getValue(value)}
      mode="tags"
      options={options}
      labelInValue
      popupMatchSelectWidth={false}
      onChange={handleChange}
    />
  );
};

export const DropdownSelectSingleValue: React.FC<{
  options: SelectProps['options'];
  value?: DropdownValue;
  placeholder?: string;
  onChange?: (value?: DropdownValue) => void;
}> = ({ value, onChange, options, placeholder }) => {
  const [open, setOpen] = useState(false);

  const handleChange = (newVal: { label?: string; value: string }[]) => {
    const formValue =
      newVal[0] &&
      (newVal[0].label
        ? { id: newVal[0].value, name: newVal[0].label }
        : { id: 'other', name: newVal[0].value });

    formValue && setOpen(false);
    onChange && onChange(formValue);
  };

  const getValue = (
    formVal?: DropdownValue
  ): { label?: string; value: string }[] | undefined => {
    if (!formVal) return [];
    const inputValue =
      formVal.id === 'other'
        ? [{ label: undefined, value: formVal.name }]
        : [{ label: formVal.name, value: formVal.id }];

    return inputValue;
  };

  return (
    <Select
      maxCount={1}
      virtual={false}
      placeholder={placeholder}
      onDropdownVisibleChange={(visible) => setOpen(visible)}
      notFoundContent={null}
      open={open}
      value={getValue(value)}
      mode="tags"
      options={options}
      labelInValue
      popupMatchSelectWidth={false}
      onChange={handleChange}
    />
  );
};
