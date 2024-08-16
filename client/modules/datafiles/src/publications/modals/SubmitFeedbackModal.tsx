import React, { useState } from 'react';
import { Button, Form, Input, Modal } from 'antd';
import { useAuthenticatedUser, useCreateFeedbackTicket } from '@client/hooks';
import { notification } from 'antd';

export const SubmitFeedbackModal: React.FC<{
  projectId: string;
  title: string;
}> = ({ projectId, title }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => setIsModalOpen(true);
  const handleClose = () => {
    setIsModalOpen(false);
  };

  const { mutate } = useCreateFeedbackTicket(projectId, title);
  const [notifApi, contextHolder] = notification.useNotification();

  const { user } = useAuthenticatedUser();
  const submitFeedback = (formData: {
    name: string;
    email: string;
    body: string;
  }) => {
    mutate(
      { formData: { ...formData, projectId, title } },
      {
        onSuccess: () => {
          handleClose();
          notifApi.open({
            type: 'success',
            message: '',
            description: 'Your feedback was successfully submitted',
            placement: 'bottomLeft',
          });
        },
      }
    );
  };

  return (
    <>
      {contextHolder}
      <Button type="link" onClick={showModal} style={{ fontWeight: 'bold' }}>
        <img
          src="/static/images/ds-icons/icon-feedback.svg"
          alt="icon of chat bubble"
          style={{ width: '12px' }}
        />
        &nbsp;Leave Feedback
      </Button>
      <Modal
        destroyOnClose
        open={isModalOpen}
        onCancel={handleClose}
        width={900}
        title={<h2>Leave Feedback</h2>}
        footer={null}
      >
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Form
            layout="vertical"
            style={{ flex: 1 }}
            onFinish={(formData) => submitFeedback(formData)}
          >
            <Form.Item
              name="name"
              label="Full Name"
              required
              rules={[{ required: true }]}
              initialValue={
                user ? `${user?.firstName} ${user?.lastName}` : undefined
              }
            >
              <Input disabled={!!user} />
            </Form.Item>
            <Form.Item
              name="email"
              label="Email"
              required
              initialValue={user ? user.email : undefined}
              rules={[{ required: true }]}
            >
              <Input disabled={!!user} />
            </Form.Item>
            <Form.Item
              name="body"
              label={
                <div>
                  <div>
                    <strong>Feedback</strong>
                  </div>
                  <div style={{ fontWeight: 'normal' }}>
                    Leave constructive feedback for the author(s) of this
                    publication.
                  </div>
                </div>
              }
              required
              rules={[{ required: true, message: 'This field is required.' }]}
            >
              <Input.TextArea autoSize={{ minRows: 4 }} />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                style={{ float: 'right' }}
                htmlType="submit"
              >
                Submit
              </Button>
            </Form.Item>
          </Form>
          <div style={{ flex: 1 }}>
            <strong>Examples of constructive questions and concerns:</strong>
            <ul>
              <li>
                Questions about the dataset that are not answered in the
                published metadata and or documentation
              </li>
              <li>Missing documentation</li>
              <li>
                Questions about the method/instruments used to generate the data
              </li>
              <li>Questions about data validation</li>
              <li>
                Concerns about data organization and or inability to find
                desired files
              </li>
              <li>
                Interest in bibliography about the data/related to the data
              </li>
              <li>Interest in reusing the data</li>
              <li>Comments about the experience of reusing the data</li>
              <li>Request to access raw data if not published</li>
              <li>Congratulations</li>
            </ul>
          </div>
        </div>
      </Modal>
    </>
  );
};
