import React, { useState } from 'react';
import { AutoComplete } from 'antd';
import {
  useGetRecentSession,
  useGetTapisFileHistory,
  useGetPortalFileHistory,
  useGetUsernames,
  PortalAuditEntry,
  PortalFileAuditEntry,
} from '@client/hooks';
import AuditTrailTable from './AuditTrailTable';

const AuditTrail: React.FC = () => {
  type Mode = 'user-session' | 'portal-file' | 'tapis-file';
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<Mode>('user-session');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<string>('');
  const [footerEntry, setFooterEntry] = useState<
    PortalAuditEntry | PortalFileAuditEntry | null
  >(null);

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
  } = useGetPortalFileHistory(query, false);

  const {
    data: tapisData,
    error: tapisError,
    isLoading: tapisLoading,
    refetch: refetchTapis,
  } = useGetTapisFileHistory(query, false);

  const filteredUsernames =
    query.length > 0 && allUsernames
      ? allUsernames
          .filter((name) => name.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 20)
      : [];

  const auditData =
    mode === 'user-session'
      ? portalData
      : mode === 'portal-file'
      ? fileData
      : tapisData;
  const auditError =
    mode === 'user-session'
      ? portalError
      : mode === 'portal-file'
      ? fileError
      : tapisError;
  const auditLoading =
    mode === 'user-session'
      ? portalLoading
      : mode === 'portal-file'
      ? fileLoading
      : tapisLoading;
  const auditRefetch =
    mode === 'user-session'
      ? refetchPortal
      : mode === 'portal-file'
      ? refetchFile
      : refetchTapis;

  // const auditData = source === 'portal' ? portalData : fileData;
  // const auditError = source === 'portal' ? portalError : fileError;
  // const auditLoading = source === 'portal' ? portalLoading : fileLoading;
  // const auditRefetch = source === 'portal' ? refetchPortal : refetchFile;

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    auditRefetch();
  };

  const handleViewLogs = (entry: PortalAuditEntry | PortalFileAuditEntry) => {
    let content = '';
    if (entry.data) {
      try {
        const obj =
          typeof entry.data === 'string' ? JSON.parse(entry.data) : entry.data;
        content = JSON.stringify(obj, null, 2);
      } catch {
        content = JSON.stringify(entry.data, null, 2);
      }
    }
    setModalContent(content);
    setFooterEntry(entry);
    setModalOpen(true);
  };

  return (
    <div>
      <form onSubmit={onSearch} style={{ marginBottom: 16 }}>
        {/* <div style={{ display: 'inline-flex', alignItems: 'center' }}> */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as Mode)}
            style={{ marginRight: 8 }}
          >
            <option value="user-session">Most Recent User Session Data</option>
            <option value="portal-file">File search (Portal)</option>
            <option value="tapis-file">File search (Tapis)</option>
          </select>
          {mode === 'user-session' ? (
            <AutoComplete
              value={query}
              style={{ marginRight: 8, width: '200px' }}
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
              style={{ marginRight: 8, width: '200px' }}
            />
          )}
          <button
            type="submit"
            disabled={auditLoading || !query}
            style={{ marginLeft: '8px' }}
          >
            {auditLoading ? 'Loading…' : 'Submit'}
          </button>
        </div>
      </form>

      <AuditTrailTable
        auditData={auditData}
        auditError={auditError}
        auditLoading={auditLoading}
        modalOpen={modalOpen}
        modalContent={modalContent}
        footerEntry={footerEntry}
        onModalClose={() => setModalOpen(false)}
        onViewLogs={handleViewLogs}
        mode={mode}
      />
    </div>
  );
};

export default AuditTrail;
