import React, { useState } from 'react';
import { AutoComplete } from 'antd';
import {
  useGetRecentSession,
  useGetPortalFileHistory,
  useGetUsernames,
} from '@client/hooks';
import AuditTrailSessionTable from './session/AuditTrailSessionTable';
import AuditTrailFileTable from './file/AuditTrailFileTable';
import { filterUsernames } from '../utils';

const AuditTrail: React.FC = () => {
  type Mode = 'user-session' | 'portal-file';
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<Mode>('user-session');
  const [usernameFilter, setUsernameFilter] = useState<string | null>(null);

  const { data: allUsernames } = useGetUsernames();
  const {
    data: portalData,
    error: portalError,
    isLoading: portalLoading,
    refetch: refetchPortal,
  } = useGetRecentSession(query, false);

  const {
    data: fileData,
    error: fileError,
    isLoading: fileLoading,
    refetch: refetchFile,
  } = useGetPortalFileHistory(query, false, usernameFilter);

  const filteredUsernames = filterUsernames(allUsernames || [], query);

  const auditRefetch = mode === 'user-session' ? refetchPortal : refetchFile;

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    if (trimmed !== query) setQuery(trimmed);
    auditRefetch();
  };

  return (
    <div>
      <form onSubmit={onSearch} style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <select
            value={mode}
            onChange={(e) => {
              setMode(e.target.value as Mode);
              setQuery('');
              setUsernameFilter(null);
            }}
            style={{ marginRight: 8 }}
          >
            <option value="user-session">Most Recent User Session Data</option>
            <option value="portal-file">File search</option>
          </select>
          {mode === 'user-session' ? (
            <AutoComplete
              value={query}
              style={{ width: '200px' }}
              options={filteredUsernames.map((name) => ({
                value: name,
                label: name,
              }))}
              onSelect={(value) => setQuery(value)}
              onSearch={(searchText) => setQuery(searchText)}
              placeholder="Username"
            />
          ) : (
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filename"
              style={{ width: '200px' }}
              maxLength={512}
            />
          )}
          <button
            type="submit"
            disabled={
              (mode === 'user-session' ? portalLoading : fileLoading) ||
              !query.trim() ||
              query.length > 512
            }
            style={{ marginLeft: '10px' }}
          >
            {(mode === 'user-session' ? portalLoading : fileLoading)
              ? 'Loading…'
              : 'Submit'}
          </button>
        </div>
      </form>

      {mode === 'user-session' ? (
        <AuditTrailSessionTable
          auditData={portalData}
          auditError={portalError}
          auditLoading={portalLoading}
        />
      ) : (
        <AuditTrailFileTable
          auditData={fileData}
          auditError={fileError}
          auditLoading={fileLoading}
          searchTerm={(query || '').trim()}
          usernameFilter={usernameFilter}
          onUsernameFilterChange={setUsernameFilter}
        />
      )}
    </div>
  );
};

export default AuditTrail;
