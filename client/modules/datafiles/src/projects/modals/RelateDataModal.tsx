import React, { useState } from 'react';
import { TModalChildren } from '../../DatafilesModal/DatafilesModal';
import { Modal } from 'antd';
import { ProjectTree, PublicationTree } from '../ProjectTree/ProjectTree';

export const RelateDataModal: React.FC<{
  projectId: string;
  readOnly?: boolean;
  children: TModalChildren;
}> = ({ projectId, readOnly, children }) => {
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
        width="900px"
        title={
          readOnly ? <h2>Data Diagram</h2> : <h2>Relate Data: {projectId}</h2>
        }
        footer={null}
      >
        <article>
          {readOnly ? (
            <PublicationTree projectId={projectId} />
          ) : (
            <ProjectTree projectId={projectId} />
          )}
        </article>
      </Modal>
    </>
  );
};
