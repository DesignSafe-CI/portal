import { Modal, Spin } from 'antd';
import { useGetJobs } from '@client/hooks';
import React from 'react';
import { useParams } from 'react-router-dom';
import styles from './JobsDetailModal.module.css';
import { TJob } from '@client/hooks';

export const JobsDetailModalBody: React.FC<{
  isOpen: boolean;
  uuid: string;
}> = ({ isOpen, uuid }) => {
  const { data, isLoading } = useGetJobs('select', { uuid }) as {
    data: TJob;
    isLoading: boolean;
  };

  return (
    <Modal
      title={<h2>Job Detail: {uuid}</h2>}
      width="60%"
      open={isOpen}
      footer={null} // Remove the footer from here
    >
      <div className={styles.modalContentContainer}>
        {isLoading && <Spin className={styles.spinner} />}
        {data && isOpen && <span>{data.name}</span>}
      </div>
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
