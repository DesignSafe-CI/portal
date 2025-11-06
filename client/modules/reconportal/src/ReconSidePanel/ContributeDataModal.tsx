import React, { useState } from 'react';
import { Button, Form, Input, Modal, Typography, notification } from 'antd';
import { useCreateFeedbackTicket } from '@client/hooks';

export const ContributeDataModal: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { Link } = Typography;

  const showModal = () => setIsModalOpen(true);
  const handleClose = () => {
    setIsModalOpen(false);
  };

  const { mutate } = useCreateFeedbackTicket(
    'RECON-PORTAL',
    'Data Contribution'
  ); // not sure if it will suffice, need to pass projectId adn title into hook, or create new hook?
  const [notifApi, contextHolder] = notification.useNotification();

  const handleSubmit = (formData: {
    name: string;
    email: string;
    dateOfHazard: string;
    eventTitle: string;
    url: string;
    latitude: string;
    longitude: string;
    body: string;
  }) => {
    //Putting all extra fields in body so they're included in ticket, hook dosen't handle these extra fields
    const formattedBody = `
        ${formData.body}

        --- Additional Information ---
        Date of Hazard Event: ${formData.dateOfHazard}
        Event Title: ${formData.eventTitle}
        URL to Data: ${formData.url}
        Latitude: ${formData.latitude}
        Longitude: ${formData.longitude}
            `.trim();

    // console.log('Formatted body that will be sent:', formattedBody);
    // console.log('Full form data:', formData);
    mutate(
      {
        formData: {
          name: formData.name,
          email: formData.email,
          body: formattedBody,
          projectId: 'RECON-PORTAL',
          title: 'Data Contribution',
        },
      },
      {
        onSuccess: () => {
          handleClose();
          notifApi.open({
            type: 'success',
            message: '',
            description:
              'Your data contribution was successfully submitted. Our team will contact you shortly to help load your data.',
            placement: 'bottomLeft',
          });
        },
        onError: () => {
          notifApi.open({
            type: 'error',
            message: 'Error',
            description: 'Submission failed, please try again.',
            placement: 'bottomLeft',
          });
        },
      }
    );
  };

  return (
    <>
      {contextHolder}
      <Link onClick={showModal}>Email us to Contribute your Data</Link>
      <Modal
        destroyOnHidden
        open={isModalOpen}
        onCancel={handleClose}
        width={900}
        title={<h2>Contribute Your Data</h2>}
        footer={null}
      >
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Form layout="vertical" style={{ flex: 1 }} onFinish={handleSubmit}>
            <Form.Item
              name="name"
              label="Full Name"
              required
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="email"
              label="Email"
              required
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="dateOfHazard"
              label="Date of Hazard Event"
              required
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="eventTitle"
              label="Event Title"
              required
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="url"
              label="URL to Data"
              required
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="latitude"
              label="Latitude"
              required
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="longitude"
              label="Longitude"
              required
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="body"
              label="Brief Description"
              required
              rules={[{ required: true }]}
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
        </div>
      </Modal>
    </>
  );
};
