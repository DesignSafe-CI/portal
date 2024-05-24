import React, { useState, useEffect } from 'react';
import { Modal, Layout, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useGetJobs, TTapisJob } from '@client/hooks';
import styles from './JobsDetailModal.module.css';
import { getStatusText, isOutputState, isTerminalState } from '../utils/jobs';
import { formatDateTime } from '../utils/timeFormat';
import { JobActionButton } from '../JobsListing/JobsListing';
import { Spinner, SecondaryButton } from '@client/common-components';

export const JobsDetailModalBody: React.FC<{
  jobData: TTapisJob;
}> = ({ jobData }) => {
  return (
    <div className={styles['modal-body-container']}>
      <div className={`${styles['left-panel']}`}>
        <dl>
          {isOutputState(jobData.status) && (
            <>
              <dt>Execution:</dt>
              <dd>
                <Button
                  type="link"
                  href={`data/browser/tapis/${
                    jobData.execSystemId
                  }/${encodeURIComponent(jobData.execSystemExecDir)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  disabled={!isOutputState(jobData.status)}
                >
                  View in Execution Directory
                </Button>
              </dd>
            </>
          )}
          <>
            <dt>Output:</dt>
            <dd>
              <Button
                type="link"
                href={`data/browser/tapis/${
                  jobData.archiveSystemId
                }/${encodeURIComponent(jobData.archiveSystemDir)}`}
                target="_blank"
                rel="noopener noreferrer"
                disabled={!isOutputState(jobData.status)}
              >
                {isOutputState(jobData.status)
                  ? 'View Output'
                  : 'Output Pending'}
              </Button>
            </dd>
          </>
        </dl>
        {isTerminalState(jobData.status) && (
          <JobActionButton
            uuid={jobData.uuid}
            title="Resubmit Job"
            operation="resubmitJob"
            type="primary"
          />
        )}
        {!isTerminalState(jobData.status) && (
          <JobActionButton
            uuid={jobData.uuid}
            title="Cancel Job"
            operation="cancelJob"
            type="primary"
          />
        )}
      </div>
      <dl className={`${styles['right-panel']} ${styles['panel-content']}`}>
        <dt>Application ID</dt>
        <dd>{jobData.appId}</dd>
        {jobData.appVersion && (
          <>
            <dt>Application Version</dt>
            <dd>{jobData.appVersion}</dd>
          </>
        )}
        <dt>Job ID</dt>
        <dd>{jobData.uuid}</dd>
        <dt>Status</dt>
        <dd>{getStatusText(jobData.status)}</dd>
        <dt>Submitted</dt>
        <dd>{formatDateTime(new Date(jobData.created))}</dd>
        <dt>Finished</dt>
        <dd>{formatDateTime(new Date(jobData.ended))}</dd>
        <dt>Last Status Message</dt>
        <dd>{jobData.lastMessage}</dd>
      </dl>
    </div>
  );
};

export const JobsDetailModal: React.FC<{ uuid: string }> = ({ uuid }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleCancel = () => {
    navigate('..', { relative: 'path' });
  };

  const { data: jobData, isLoading } = useGetJobs('select', { uuid }) as {
    data: TTapisJob;
    isLoading: boolean;
  };

  useEffect(() => {
    setIsModalOpen(!!uuid);
  }, [uuid]);

  return (
    <Modal
      className={`${styles.root} job-history-modal`}
      title={
        <>
          <header>
            Job Detail: {uuid}
            {jobData && (
              <dl className={styles['header-details']}>
                <dt>Job UUID: </dt>
                <dd>{jobData.uuid}</dd>
                <dt>Application: </dt>
                <dd>{JSON.parse(jobData.notes).label || jobData.appId}</dd>
                <dt>System: </dt>
                <dd>{jobData.execSystemId}</dd>
              </dl>
            )}
          </header>
        </>
      }
      width="60%"
      open={isModalOpen}
      onCancel={handleCancel}
      footer={null}
    >
      {isLoading ? (
        <Layout style={{ height: 300 }}>
          <Spinner />
        </Layout>
      ) : (
        jobData && <JobsDetailModalBody jobData={jobData} />
      )}
    </Modal>
  );
};
