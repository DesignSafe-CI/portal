import { apiClient, useDebounceValue } from '@client/hooks';
import { Select, SelectProps } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';

export type TProjectUser = {
  fname: string;
  lname: string;
  username: string;
  email: string;
  inst: string;
  role: string;
};

export const UserSelect: React.FC<{
  value?: TProjectUser[];
  onChange?: (value: TProjectUser[]) => void;
  id?: string;
  userRole?: string;
  maxCount?: number;
  disabled?: boolean;
}> = ({ value, onChange, id, userRole, maxCount, disabled }) => {
  const initialOptions: SelectProps['options'] = useMemo(
    () =>
      value?.map((u) => ({
        label: `${u.fname} ${u.lname} (${u.email})`,
        value: JSON.stringify(u),
      })) ?? [],
    [value]
  );
  const [data, setData] = useState<SelectProps['options']>(initialOptions);
  const [open, setOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const debouncedSearchTerm = useDebounceValue(searchTerm, 100);

  useEffect(() => {
    if (!debouncedSearchTerm || debouncedSearchTerm.length < 3) {
      setData([]);
      return;
    }
    const controller = new AbortController();
    apiClient
      .get<{
        result: Omit<TProjectUser, 'role'>[];
      }>(`/api/users/project-lookup/?q=${debouncedSearchTerm}`, {
        signal: controller.signal,
      })
      .then((resp) =>
        resp.data.result.map((u) => ({
          label: `${u.fname} ${u.lname} (${u.email})`,
          value: JSON.stringify({ ...u, role: userRole }),
        }))
      )
      .then((opts) => setData(opts))
      .catch((_) => setData([]));
    return () => controller.abort();
  }, [debouncedSearchTerm, setData, userRole]);

  const changeCallback = (newValue: string[]) => {
    onChange && onChange(newValue.map((v) => JSON.parse(v)));
    setSearchTerm('');
    setOpen(false);
  };

  return (
    <Select
      id={id}
      notFoundContent={
        <span>
          No users were found matching your query. An exact TACC username match
          is required.
        </span>
      }
      open={open}
      onDropdownVisibleChange={(visible) => setOpen(visible)}
      value={value && value.map((v) => JSON.stringify(v))}
      maxCount={maxCount}
      mode="multiple"
      placeholder="Look up users by TACC username. Exact match required."
      showSearch
      options={debouncedSearchTerm ? data : initialOptions}
      onSearch={setSearchTerm}
      onChange={changeCallback}
      disabled={disabled}
    />
  );
};
