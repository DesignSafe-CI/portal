import React, { useState } from 'react';
import { AutoComplete } from 'antd';
import {
  useGetRecentSession,
  useGetFileHistory,
  useGetUsernames,
  PortalAuditEntry,
} from '@client/hooks';
import AuditTrailTable from './AuditTrailTable';

const AuditTrail: React.FC = () => {
  const [username, setUsername] = useState('');
  const [source, setSource] = useState<'portal' | 'tapis'>('portal');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<string>('');
  const [footerEntry, setFooterEntry] = useState<PortalAuditEntry | null>(null);

  const { data: allUsernames } = useGetUsernames();
  const {
    data: portalData,
    error: portalError,
    isLoading: portalLoading,
    refetch: refetchPortal,
  } = useGetRecentSession(username, false);

  const {
    data: fileData,
    error: fileError,
    isLoading: fileLoading,
    refetch: refetchFile,
  } = useGetFileHistory(username, false);

  const filteredUsernames =
    username.length > 0 && allUsernames
      ? allUsernames
          .filter((name) => name.toLowerCase().includes(username.toLowerCase()))
          .slice(0, 20)
      : [];

  const auditData = source === 'portal' ? portalData : fileData;
  const auditError = source === 'portal' ? portalError : fileError;
  const auditLoading = source === 'portal' ? portalLoading : fileLoading;
  const auditRefetch = source === 'portal' ? refetchPortal : refetchFile;

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    auditRefetch();
  };

  const handleViewLogs = (entry: PortalAuditEntry) => {
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
        <div style={{ display: 'inline-flex', alignItems: 'center' }}>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as 'portal' | 'tapis')}
            style={{ marginRight: 8 }}
          >
            <option value="portal">Most Recent User Session Data</option>
            <option value="tapis">File Search Data</option>
          </select>
          <AutoComplete
            value={username}
            style={{ marginRight: 8, width: '200px' }}
            options={
              source === 'portal'
                ? filteredUsernames.map((name) => ({
                    value: name,
                    label: name,
                  }))
                : []
            }
            onSelect={(value) => {
              setUsername(value);
            }}
            onSearch={(searchText) => {
              setUsername(searchText);
            }}
            placeholder="Username/File Name:"
          />
          <button
            type="submit"
            disabled={auditLoading || !username}
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
        source={source}
      />
    </div>
  );
};

export default AuditTrail;
