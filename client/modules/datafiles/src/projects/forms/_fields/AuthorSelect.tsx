import { Checkbox } from 'antd';
import React, { useCallback, useMemo } from 'react';
import { TProjectUser } from '@client/hooks';

export const AuthorSelect: React.FC<{
  projectUsers: TProjectUser[];
  currentAuthors?: TProjectUser[];
  value?: TProjectUser[];
  onChange?: (value: TProjectUser[]) => void;
}> = ({ value, onChange, projectUsers, currentAuthors = [] }) => {
  const orderedUsers = useMemo(() => {
    // Ensure author order is not reset when adding/changing authors.
    const authorUsers: TProjectUser[] = currentAuthors
      .map((a) =>
        projectUsers.find(
          (u) =>
            (u.email || '') === (a.email || '') &&
            u.fname === a.fname &&
            u.lname === a.lname
        )
      )
      .filter((u) => !!u);

    const nonAuthorUsers: TProjectUser[] = projectUsers
      .filter(
        (u) =>
          !currentAuthors.find(
            (a) =>
              (u.email || '') === (a.email || '') &&
              u.fname === a.fname &&
              u.lname === a.lname
          )
      )
      .filter((u) => !!u);

    return [...authorUsers, ...nonAuthorUsers];
  }, [projectUsers, currentAuthors]);

  const options = orderedUsers.map((author) => ({
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
      value={orderedUsers
        .filter((user) =>
          value?.some(
            (v) =>
              (user.email || '') === (v.email || '') &&
              user.fname === v.fname &&
              user.lname === v.lname
          )
        )
        .map((v) => JSON.stringify(v) ?? [])}
      options={options}
      onChange={onChangeCallback}
    />
  );
};
