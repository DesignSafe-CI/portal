import React, { useState } from 'react';
import { Button, Modal } from 'antd';
import { PlusCircleOutlined } from '@ant-design/icons';
import { useProjectDetail } from '@client/hooks';

export const ProjectDataTransferModal: React.FC<{
  projectId: string;
}> = ({ projectId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data } = useProjectDetail(projectId);
  const showModal = () => setIsModalOpen(true);
  const handleClose = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Button type="link" style={{ fontWeight: 'bold' }} onClick={showModal}>
        <PlusCircleOutlined />
        <span style={{ marginLeft: '2px' }}>
          Learn how to transfer data to this project
        </span>
      </Button>
      <Modal
        open={isModalOpen}
        onCancel={handleClose}
        width={900}
        title={<h2>Transfer Data</h2>}
        footer={null}
      >
        <article>
          <p>
            To transfer data to this project, please consult the{' '}
            <a
              href="https://www.designsafe-ci.org/user-guide/managingdata/#data-transfer-guides"
              rel="noopener noreferrer"
              target="_blank"
            >
              Data Transfer Guide
            </a>{' '}
            for recommended methods.
          </p>
          <p>
            This project's data directory is accessible on{' '}
            <strong>data.tacc.utexas.edu</strong> at the following path:
          </p>
          <p>
            <code>{`/corral/projects/NHERI/projects/${data?.baseProject.uuid}`}</code>
          </p>
        </article>
      </Modal>
    </>
  );
};
