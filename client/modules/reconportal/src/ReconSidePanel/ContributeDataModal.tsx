import React, { useState } from 'react';
import { Button, Form, Input, Modal, Typography, notification } from 'antd';
import { Formik, Form as FormikForm } from 'formik';
import * as Yup from 'yup';
import ReCAPTCHA from 'react-google-recaptcha';
import { useCreateFeedbackTicket } from '@client/hooks';

const formShape = {
  name: Yup.string().required('Required'),
  email: Yup.string().email('Invalid email').required('Required'),
  dateOfHazard: Yup.string().required('Required'),
  eventTitle: Yup.string().required('Required'),
  url: Yup.string().url('Invalid URL').required('Required'),
  latitude: Yup.number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90')
    .required('Required'),
  longitude: Yup.number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
    .required('Required'),
  body: Yup.string()
    .required('Required')
    .min(10, 'Description must be at least 10 characters'),
  recaptchaResponse: Yup.string().required('Required'),
};

const formSchema = Yup.object().shape(formShape);

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

  const handleSubmit = (
    formData: {
      name: string;
      email: string;
      dateOfHazard: string;
      eventTitle: string;
      url: string;
      latitude: string;
      longitude: string;
      body: string;
      recaptchaResponse: string;
    },
    { resetForm }: { resetForm: () => void }
  ) => {
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
          recaptchaToken: formData.recaptchaResponse, //not working with this part
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

  const initialValues = {
    name: '',
    email: '',
    dateOfHazard: '',
    eventTitle: '',
    url: '',
    latitude: '',
    longitude: '',
    body: '',
    recaptchaResponse: '',
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
          <Formik layout="vertical" style={{ flex: 1 }} onFinish={handleSubmit}>
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
