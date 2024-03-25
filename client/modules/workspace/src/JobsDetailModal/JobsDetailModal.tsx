import { Modal, Spin } from 'antd';
import { useGetJobs } from '@client/hooks';
import React, { useState } from 'react';
import styles from './JobsDetailModal.module.css';

export type TModalChildren = (props: {
  onClick: React.MouseEventHandler<HTMLElement>;
}) => React.ReactElement;

export const JobsDetailModalBody: React.FC<{
  isOpen: boolean;
  uuid: string;
}> = ({ isOpen, uuid }) => {
  const { data, isLoading } = useGetJobs('select', { uuid });

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

export const JobsDetailModal: React.FC<{
  uuid: string;
  children: TModalChildren;
}> = ({ uuid, children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      {React.createElement(children, { onClick: showModal })}
      <JobsDetailModalBody uuid={uuid} isOpen={isModalOpen} />
    </>
  );
};
