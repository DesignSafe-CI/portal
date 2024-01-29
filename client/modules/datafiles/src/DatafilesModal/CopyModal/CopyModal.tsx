import React, { useState } from 'react';
import { TModalChildren } from '../DatafilesModal';
import { Modal } from 'antd';

export const CopyModal: React.FC<{ children: TModalChildren }> = ({
  children,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const onOk = () => {
    //Placeholder for file copy logic
  };

  return (
    <>
      {React.createElement(children, { onClick: showModal })}
      <Modal
        open={isModalOpen}
        onCancel={handleCancel}
        onOk={onOk}
        title="Copy Files"
      >
        Copy Modal Placeholder
      </Modal>
    </>
  );
};
