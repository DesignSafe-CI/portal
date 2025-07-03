import React from 'react';
import { Modal, Button, Layout } from 'antd';
import { useGetApps, useGetJobs, TAppResponse, TTapisJob } from '@client/hooks';
import { Spinner } from '@client/common-components';
import { JobsDetailModalBody } from '@client/workspace';
import styles from './Dashboard.module.css';
interface JobDetailModalWrapperProps {
  uuid: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const JobDetailModalWrapper: React.FC<JobDetailModalWrapperProps> = ({
  uuid,
  isOpen,
  onClose,
}) => {
  const { data: jobData, isLoading } = useGetJobs('select', {
    uuid: uuid || '',
  }) as {
    data: TTapisJob;
    isLoading: boolean;
  };

  const appId = jobData?.appId;
  const appVersion = jobData?.appVersion;

  const { data: appData, isLoading: isAppLoading } = useGetApps({
    appId,
    appVersion,
  }) as {
    data: TAppResponse;
    isLoading: boolean;
  };

  if (!uuid) return null;

  return (
    <Modal
      className="job-history-modal"
      title={
        <header>
          Job Detail: {jobData?.name}
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
      }
      width="60%"
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      {isLoading || isAppLoading ? (
        <Layout style={{ height: 300 }}>
          <Spinner />
        </Layout>
      ) : (
        jobData && <JobsDetailModalBody jobData={jobData} appData={appData} />
      )}
    </Modal>
  );
};
