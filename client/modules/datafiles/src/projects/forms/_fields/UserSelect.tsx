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
  userRole?: string;
  maxCount?: number;
}> = ({ value, onChange, userRole, maxCount }) => {
  const initialOptions: SelectProps['options'] = useMemo(
    () =>
      value?.map((u) => ({
        label: `${u.fname} ${u.lname} (${u.email})`,
        value: JSON.stringify(u),
      })) ?? [],
    [value]
  );
  const [data, setData] = useState<SelectProps['options']>(initialOptions);

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
  };

  return (
    <Select
      notFoundContent={null}
      value={value && value.map((v) => JSON.stringify(v))}
      maxCount={maxCount}
      mode="multiple"
      placeholder="Look up users by TACC username. Exact match required."
      showSearch
      options={debouncedSearchTerm ? data : initialOptions}
      onSearch={setSearchTerm}
      onChange={changeCallback}
    />
  );
};
