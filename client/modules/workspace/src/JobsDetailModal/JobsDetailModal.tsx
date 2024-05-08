import React, { useMemo } from 'react';
import { Modal, Button } from 'antd';
import { useGetJobs } from '@client/hooks';
import { useParams } from 'react-router-dom';
import styles from './JobsDetailModal.module.css';
import { getStatusText } from '../utils/jobs';
import { TJob } from '@client/hooks';

export const JobsDetailModalBody: React.FC<{
  isOpen: boolean;
  uuid: string;
}> = ({ isOpen, uuid }) => {
  const { data, isLoading } = useGetJobs('select', { uuid }) as {
    data: TJob;
    isLoading: boolean;
  };
  const handleClose = () => isOpen == false;

  return (
    <Modal
      title={<><h3>{data.name}-{data.uuid}
      </h3><hr /></>}
      width="60%"
      open={isOpen}
      onCancel={handleClose}
      className={styles.modalContentContainer}
      footer={''} // Remove the footer from here
    >

      <dl>
        <dt>Application</dt>
        <dd>{data.appId}</dd>
        <dt>Job ID</dt>
        <dd>{data.uuid}</dd>
        <dt>Status</dt>
        <dd>{getStatusText(data)}</dd>
        <dt>Submitted</dt>
        <dd>{Date(data.created).toLocaleString()}</dd>
        <dt>Finished</dt>
        <dd>{Date(data.ended).toLocaleString()}</dd>
        <dt>Last Status Message</dt>
        <dd>{data.lastMessage}</dd>
        <dt>Output  </dt><dd>
          <Button type="primary" htmlType="button"
            href={`data/browser/${data.archiveSystemId}${data.archiveSystemDir}`}>
            View in Data Files
          </Button></dd>
        <dt>Actions</dt>
        <dd>
          <Button type="primary" danger> 
            Delete
          </Button>
        </dd>
      </dl>
    </Modal>
  );
};

export const JobsDetailModal: React.FC = () => {
  type JobsDetailModalParams = {
    uuid: string;
  };
  const { uuid } = useParams<JobsDetailModalParams>() as JobsDetailModalParams;

  return <JobsDetailModalBody uuid={uuid} isOpen={true} />;
};
