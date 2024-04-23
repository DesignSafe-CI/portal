import { Checkbox } from 'antd';
import React, { useCallback } from 'react';
import { TProjectUser } from '@client/hooks';

export const AuthorSelect: React.FC<{
  projectUsers: TProjectUser[];
  value?: TProjectUser[];
  onChange?: (value: TProjectUser[]) => void;
}> = ({ value, onChange, projectUsers }) => {
  const options = projectUsers.map((author) => ({
    value: JSON.stringify(author),
    label: `${author.fname} ${author.lname} (${author.email})`,
  }));

  const onChangeCallback = useCallback(
    (value: string[]) => {
      if (onChange) onChange(value.map((a) => JSON.parse(a)));
    },
    [onChange]
  );

  return (
    <Checkbox.Group
      style={{ flexDirection: 'column' }}
      value={projectUsers
        .filter((user) => value?.some((v) => user.email === v.email))
        .map((v) => JSON.stringify(v) ?? [])}
      options={options}
      onChange={onChangeCallback}
    />
  );
};
