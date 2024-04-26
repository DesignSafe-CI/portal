import React, { useState } from 'react';
import { Button, Modal, Form, Input } from 'antd';
import { usePushKeys } from '@client/hooks';

export const SystemsPushKyesModalBody: React.FC<{
  isOpen: boolean;
  system: {};
  onSuccess: () => void;
  handleCancel: () => void;
}> = ({ isOpen, system, onSuccess, handleCancel }) => {
  const { mutate } = usePushKeys();

  const initialValues = {
    systemId: system.id,
    hostname: system.host,
    password: '',
    token: '',
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await mutate({
        ...data,
      });

      // Keys pushed successfully, close the modal and call onSuccess()
      setIsSubmitting(false);
      handleCancel();

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error during form submission:', error);
      // Handle error if needed
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title={<h2>Authenticate with TACC Token</h2>}
      width="60%"
      open={isOpen}
      footer={null} // Remove the footer from here
      onCancel={handleCancel}
    >
      <Form
        autoComplete="off"
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={initialValues}
      >
        <Form.Item label="System ID" name="systemId">
          <Input />
        </Form.Item>
        <Form.Item label="Host" name="hostname">
          <Input />
        </Form.Item>
        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: 'Please input your password.' }]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item
          label="TACC Token"
          name="token"
          rules={[
            {
              required: true,
              message: 'Please input your 6-digit numerical TACC Token',
            },
          ]}
        >
          <Input.OTP length={6} />
        </Form.Item>
        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
          <Button
            type="primary"
            htmlType="submit"
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            Submit
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export const SystemsPushKeysModal: React.FC<{
  onSuccess: () => void;
  isModalOpen: object;
  setIsModalOpen: () => void;
}> = ({ onSuccess, isModalOpen, setIsModalOpen }) => {
  const handleCancel = () => {
    setIsModalOpen({});
  };

  return (
    <>
      <SystemsPushKyesModalBody
        system={isModalOpen}
        isOpen={!!Object.keys(isModalOpen).length}
        onSuccess={onSuccess}
        handleCancel={handleCancel}
      />
    </>
  );
};
