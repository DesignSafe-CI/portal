import React, { useState } from 'react';
import { Button, Modal, Form, Input } from 'antd';
import { usePushKeys, TTapisSystem, TPushKeysBody } from '@client/hooks';

export const SystemsPushKyesModalBody: React.FC<{
  system?: TTapisSystem;
  onSuccess?: () => void;
  handleCancel: () => void;
}> = ({ system, onSuccess, handleCancel }) => {
  const { mutate } = usePushKeys();
  const [form] = Form.useForm();

  const initialValues = {
    systemId: system?.id,
    hostname: system?.host,
    password: '',
    token: '',
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: TPushKeysBody) => {
    setIsSubmitting(true);
    try {
      await mutate({
        ...data,
      });

      // Keys pushed successfully, close the modal and call onSuccess()
      setIsSubmitting(false);
      handleCancel();
      form.resetFields();

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
      open={!!system}
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
          <Input readOnly />
        </Form.Item>
        <Form.Item label="Host" name="hostname">
          <Input readOnly />
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
  onSuccess?: () => void;
  isModalOpen: TTapisSystem | undefined;
  setIsModalOpen: React.Dispatch<
    React.SetStateAction<TTapisSystem | undefined>
  >;
}> = ({ onSuccess, isModalOpen, setIsModalOpen }) => {
  const handleCancel = () => {
    setIsModalOpen(undefined);
  };

  return (
    <SystemsPushKyesModalBody
      system={isModalOpen}
      onSuccess={onSuccess}
      handleCancel={handleCancel}
    />
  );
};
