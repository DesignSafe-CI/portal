import React, { useState } from 'react';
import { Button, Modal } from 'antd';
import { TBaseProjectValue } from '@client/hooks';

import { ProjectInfoDisplay } from './ChangeProjectTypeModal';

export const ProjectInfoModal: React.FC<{
  projectType: TBaseProjectValue['projectType'];
}> = ({ projectType }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => setIsModalOpen(true);
  const handleClose = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Button type="link" onClick={showModal}>
        <strong>View Overview</strong>
      </Button>
      <Modal
        open={isModalOpen}
        onCancel={handleClose}
        width={900}
        title={<h2>Overview</h2>}
        footer={null}
      >
        <article>
          <ProjectInfoDisplay
            projectType={projectType}
            showOptions={false}
            onGoBack={handleClose}
            onComplete={handleClose}
          />
        </article>
      </Modal>
    </>
  );
};
