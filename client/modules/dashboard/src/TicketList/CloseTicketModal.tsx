import React from 'react';
import { Modal, Button, Alert, Form, Input } from 'antd';

interface CloseTicketModalProps {
  ticketId: number | null;
  isOpen: boolean;
  closing: boolean;
  closeError: string | null;
  onCancel: () => void;
  onConfirm: (comment: string) => void;
}

export const CloseTicketModal: React.FC<CloseTicketModalProps> = ({
  ticketId,
  isOpen,
  closing,
  closeError,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm();

  const handleFormSubmit = (values: { reply: string }) => {
    onConfirm(values.reply);
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={<h2>Confirm Close</h2>}
      width="60%"
      open={isOpen}
      destroyOnClose
      footer={null}
      onCancel={handleCancel}
    >
      {closeError && <Alert message={closeError} type="error" showIcon />}
      <div>
        Are you sure you want to close this ticket? Please provide a comment.
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFormSubmit}
        autoComplete="off"
      >
        <Form.Item
          name="reply"
          label={
            <>
              <strong>Enter Close Comment</strong>
              <span style={{ color: '#d9534f', marginLeft: '4px' }}>
                (required)
              </span>
            </>
          }
          rules={[
            {
              required: true,
              message: 'Please provide a close comment.',
            },
          ]}
        >
          <Input.TextArea
            rows={4}
            placeholder="Enter Close Comment"
            autoSize={{ minRows: 4 }}
          />
        </Form.Item>

        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <Button onClick={handleCancel} disabled={closing}>
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={closing}
            style={{ marginLeft: '8px' }}
          >
            Close
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
