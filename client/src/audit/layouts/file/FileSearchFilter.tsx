import React, { useState } from 'react';
import { AutoComplete } from 'antd';
import { useGetUsernames } from '@client/hooks';
import { filterUsernames } from '../../utils';

interface FileSearchFiltersProps {
  username: string | null;
  onUsernameChange: (username: string | null) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
}

export const FileSearchFilters: React.FC<FileSearchFiltersProps> = ({
  username,
  onUsernameChange,
  showFilters,
  onToggleFilters,
}) => {
  const [usernameQuery, setUsernameQuery] = useState('');
  const { data: allUsernames } = useGetUsernames();

  const filteredUsernames = filterUsernames(allUsernames || [], usernameQuery);

  const handleUsernameSelect = (value: string) => {
    onUsernameChange(value);
    setUsernameQuery(value);
  };

  const handleClear = () => {
    onUsernameChange(null);
    setUsernameQuery('');
  };

  return (
    <div>
      <div
        onClick={onToggleFilters}
        style={{
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <span>{showFilters ? '▼' : '▶'}</span>
        <span> Filters</span>
      </div>

      {showFilters && (
        <div style={{ marginTop: '8px' }}>
          Username
          <AutoComplete
            value={username || usernameQuery}
            style={{ width: '250px', marginLeft: '8px' }}
            options={filteredUsernames.map((name) => ({
              value: name,
              label: name,
            }))}
            onSelect={handleUsernameSelect}
            onSearch={(searchText) => setUsernameQuery(searchText)}
            allowClear
            onClear={handleClear}
          />
        </div>
      )}
    </div>
  );
};
