import React, { useState, useEffect } from 'react';
import { Modal, Spin, Button } from 'antd';
import { useGetJobs } from '@client/hooks';
import { useParams, NavLink } from 'react-router-dom';
import styles from './JobsDetailModal.module.css';
import { getStatusText } from '../utils/jobs';
import { formatDateTime } from '../utils/timeFormat';
import { TJob } from '@client/hooks';

const DataFilesLink: React.FC<
  React.PropsWithChildren<{
    to: string;
  }>
> = ({ to, children }) => {
  return (
    <NavLink to={to} className={styles.link}>
      {children}
    </NavLink>
  );
};

export const JobsDetailModalBody: React.FC<{
  isOpen: boolean;
  uuid: string;
  onToggleModal: (isOpen: boolean) => void;
}> = ({ isOpen, uuid, onToggleModal }) => {
  const { data, isLoading } = useGetJobs('select', { uuid }) as {
    data: TJob;
    isLoading: boolean;
  };
  const [isModalOpen, setIsModalOpen] = useState(isOpen);

  useEffect(() => {
    setIsModalOpen(isOpen);
  }, [isOpen]);

  const handleCancel = () => {
    setIsModalOpen(false);
    onToggleModal(false);
  };

  return (
    <Modal
      className={`${styles.root} job-history-modal`}
      title={
        data && (
          <>
            <header>
              Job Detail: {data.name}-{uuid}
              <dl className={styles['header-details']}>
                <dt>Job UUID: </dt>
                <dd>{uuid}</dd>
                <dt>Application: </dt>
                <dd>{data.name}</dd>
                <dt>System: </dt>
                <dd>{data.execSystemId}</dd>
              </dl>
            </header>
          </>
        )
      }
      width="60%"
      open={isModalOpen}
      onCancel={handleCancel}
      footer={null} // Remove the footer from here
    >
      <div className={styles['modal-body-container']}>
        {isLoading && <Spin className={styles.spinner} />}
        {data && isOpen && (
          <>
            <div className={`${styles['left-panel']}`}>
              <dl>
                <dt>Execution:</dt>
                <dd>
                  <DataFilesLink
                    to={`./data/browser/${data.archiveSystemId}${data.archiveSystemDir}`}
                  >
                    View in Data Files
                  </DataFilesLink>
                </dd>
                <dt>Output:</dt>
                <dd>
                  <DataFilesLink
                    to={`./data/browser/${data.archiveSystemId}${data.archiveSystemDir}`}
                  >
                    View in Data Files
                  </DataFilesLink>
                </dd>
              </dl>
              <Button type="primary" className={styles['submit-button']}>
                Resubmit Job
              </Button>
              <Button type="primary" className={styles['submit-button']}>
                Cancel Job
              </Button>

              <Button type="primary" className={styles['submit-button']} danger>
                Delete Job
              </Button>
            </div>
            <dl
              className={`${styles['right-panel']} ${styles['panel-content']}`}
            >
              <dt>Application</dt>
              <dd>
                {data.appId} {data.appVersion}
              </dd>
              <dt>Job ID</dt>
              <dd>{data.uuid}</dd>
              <dt>Status</dt>
              <dd>{getStatusText(data.status)}</dd>
              <dt>Submitted</dt>
              <dd>{formatDateTime(new Date(data.created))}</dd>
              <dt>Finished</dt>
              <dd>{formatDateTime(new Date(data.ended))}</dd>
              <dt>Last Status Message</dt>
              <dd>{data.lastMessage}</dd>
            </dl>
          </>
        )}
      </div>
    </Modal>
  );
};

export const JobsDetailModal: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCancel = () => {
    setIsModalOpen(false);
  };
  type JobsDetailModalParams = {
    uuid: string;
  };
  const { uuid } = useParams<JobsDetailModalParams>() as JobsDetailModalParams;

  return (
    <JobsDetailModalBody
      uuid={uuid}
      isOpen={isModalOpen}
      onToggleModal={handleCancel}
    />
  );
};
