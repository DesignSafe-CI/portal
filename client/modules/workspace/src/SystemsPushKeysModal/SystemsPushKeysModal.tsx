import React, { useEffect } from 'react';
import { Modal, Form, Input, Alert } from 'antd';
import { usePushKeys, TTapisSystem, TPushKeysBody } from '@client/hooks';
import { PrimaryButton } from '@client/common-components';

export const SystemsPushKeysModalBody: React.FC<{
  system?: TTapisSystem;
  onSuccess?: () => void;
  handleCancel: () => void;
}> = ({ system, onSuccess, handleCancel }) => {
  const {
    mutate: pushKeys,
    error: pushKeysError,
    isPending,
    isSuccess,
  } = usePushKeys();
  const [form] = Form.useForm();

  const initialValues = {
    systemId: system?.id,
    hostname: system?.host,
    password: '',
    token: '',
  };

  useEffect(() => {
    if (isSuccess) {
      // Keys pushed successfully, close the modal and call onSuccess()
      handleCancel();
      if (onSuccess) {
        onSuccess();
      }
    }
  }, [isSuccess]);

  const getErrorMessage = (error?: string) => {
    if (!error) return 'There was a problem pushing your keys to the server.';

    if (error?.includes('SYSAPI_CRED_VALID_FAIL'))
      return 'Invalid credentials. Please input a valid TACC Token and password.';

    return error;
  };

  return (
    <Modal
      title={<h2>Authenticate with TACC Token</h2>}
      width="600px"
      open={!!system}
      destroyOnClose
      onCancel={handleCancel}
      footer={null}
    >
      <Alert
        type="info"
        message={
          <>
            To proceed, you must authenticate to this system with a six-digit
            one time passcode at least once. If you have not yet created an MFA
            pairing for your account, navigate to your{' '}
            <a href="https://tacc.utexas.edu/portal/account" target="_blank">
              TACC User Portal Account
            </a>
            . A public key will be pushed to your <code>authorized_keys</code>{' '}
            file on the system below. This will allow you to access this system
            from this portal.
          </>
        }
        showIcon
        style={{ margin: '15px 10px' }}
      />
      <Form
        autoComplete="off"
        layout="vertical"
        onFinish={(data: TPushKeysBody) => pushKeys(data)}
        initialValues={initialValues}
        form={form}
        preserve={false}
      >
        <Form.Item label="System ID" name="systemId">
          <span className="ant-form-text">{initialValues.systemId}</span>
        </Form.Item>
        <Form.Item label="Host" name="hostname">
          <span className="ant-form-text">{initialValues.hostname}</span>
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
              message: 'Please input your 6-digit numerical TACC Token.',
            },
          ]}
        >
          <Input.OTP length={6} />
        </Form.Item>
        <div>
          {pushKeysError && (
            <Alert
              message={getErrorMessage(pushKeysError.response?.data.message)}
              type="error"
              showIcon
              style={{ margin: '15px 10px' }}
            />
          )}
          <Form.Item style={{ float: 'right' }}>
            <PrimaryButton
              type="primary"
              htmlType="submit"
              disabled={isPending}
              loading={isPending}
            >
              Authenticate
            </PrimaryButton>
          </Form.Item>
        </div>
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
    <SystemsPushKeysModalBody
      system={isModalOpen}
      onSuccess={onSuccess}
      handleCancel={handleCancel}
    />
  );
};
