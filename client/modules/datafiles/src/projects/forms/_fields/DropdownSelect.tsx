import { Select, SelectProps } from 'antd';
import React from 'react';

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
      placement="bottomLeft"
      maxCount={maxCount}
      value={getValue(value)}
      mode="tags"
      options={options}
      labelInValue
      onChange={handleChange}
    />
  );
};
