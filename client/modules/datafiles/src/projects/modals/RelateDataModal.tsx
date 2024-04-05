import React, { useState } from 'react';
import { TModalChildren } from '../../DatafilesModal/DatafilesModal';
import { Modal } from 'antd';
import { ProjectTree } from '../ProjectTree/ProjectTree';

export const RelateDataModal: React.FC<{
  projectId: string;
  children: TModalChildren;
}> = ({ projectId, children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => setIsModalOpen(true);
  const handleClose = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      {React.createElement(children, { onClick: showModal })}
      <Modal
        open={isModalOpen}
        onCancel={handleClose}
        width="50%"
        title={<h2>Relate Data: {projectId}</h2>}
        footer={null}
      >
        <article>
          <ProjectTree projectId={projectId} />
        </article>
      </Modal>
    </>
  );
};
