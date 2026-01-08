import React, { useState } from 'react';
import { Button, Form, Input, Modal, Typography, notification } from 'antd';
import { z } from 'zod';
import ReCAPTCHA from 'react-google-recaptcha';
import { useCreateFeedbackTicket } from '@client/hooks';
import { DateInput } from '@client/datafiles';

const formSchema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email('Invalid Email').min(1, 'Required'),
  dateOfHazard: z.string().min(1, 'Required'),
  eventTitle: z.string().min(1, 'Required'),
  url: z.string().url('Invalid URL').min(1, 'Required'),
  latitude: z.coerce
    .number({
      required_error: 'Required',
      invalid_type_error: 'Latitude must be a number',
    })
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  longitude: z.coerce
    .number({
      required_error: 'Required',
      invalid_type_error: 'Longitude must be a number',
    })
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
  body: z.string().min(10, 'Description must be at least 10 characters'),
  recaptchaResponse: z.string().min(1, 'Please complete the reCAPTCHA'),
});

type FormValues = z.infer<typeof formSchema>;

export const ContributeDataModal: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm<FormValues>();
  const { Link } = Typography;
  const recaptchaSiteKey =
    (window as any).__RECAPTCHA_ENTERPRISE_SITE_KEY || '';

  const showModal = () => setIsModalOpen(true);
  const handleClose = () => {
    form.resetFields();
    setIsModalOpen(false);
  };

  const { mutate } = useCreateFeedbackTicket(
    'RECON-PORTAL',
    'Data Contribution'
  ); // not sure if it will suffice, need to pass projectId adn title into useCreateFeedbackTicket, or create new hook?
  const [notifApi, contextHolder] = notification.useNotification();

  const handleSubmit = (values: FormValues) => {
    // Putting all extra fields in body so they're included in ticket, hook doesn't handle these extra fields
    const formattedBody = `
        ${values.body}

        --- Additional Information ---
        Date of Hazard Event: ${values.dateOfHazard || ''}
        Event Title: ${values.eventTitle}
        URL to Data: ${values.url}
        Latitude: ${values.latitude}
        Longitude: ${values.longitude}
    `.trim();

    mutate(
      {
        formData: {
          name: values.name,
          email: values.email,
          body: formattedBody,
          projectId: 'RECON-PORTAL',
          title: 'Data Contribution',
          recaptchaToken: values.recaptchaResponse,
        },
      },
      {
        onSuccess: () => {
          form.resetFields();
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

  const validateField = (fieldName: keyof FormValues) => {
    return async (_: any, value: any) => {
      const fieldSchema = formSchema.shape[fieldName];
      try {
        await fieldSchema.parseAsync(value);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return Promise.reject(error.errors[0]?.message);
        }
        return Promise.reject('Validation failed');
      }
    };
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
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          <Form.Item
            label="Full Name"
            name="name"
            rules={[{ validator: validateField('name') }]}
            required
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[{ validator: validateField('email') }]}
            required
          >
            <Input type="email" />
          </Form.Item>

          <Form.Item
            label="Date of Hazard Event"
            name="dateOfHazard"
            rules={[{ validator: validateField('dateOfHazard') }]}
            required
          >
            <DateInput />
          </Form.Item>

          <Form.Item
            label="Event Title"
            name="eventTitle"
            rules={[{ validator: validateField('eventTitle') }]}
            required
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="URL to Data"
            name="url"
            rules={[{ validator: validateField('url') }]}
            required
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Latitude"
            name="latitude"
            rules={[{ validator: validateField('latitude') }]}
            required
          >
            <Input
              type="number"
              onChange={(e) => {
                const num = Number(e.target.value);
                form.setFieldValue(
                  'latitude',
                  e.target.value === '' || isNaN(num) ? undefined : num
                );
              }}
            />
          </Form.Item>

          <Form.Item
            label="Longitude"
            name="longitude"
            rules={[{ validator: validateField('longitude') }]}
            required
          >
            <Input
              type="number"
              onChange={(e) => {
                const num = Number(e.target.value);
                form.setFieldValue(
                  'longitude',
                  e.target.value === '' || isNaN(num) ? undefined : num
                );
              }}
            />
          </Form.Item>

          <Form.Item
            label="Brief Description"
            name="body"
            rules={[{ validator: validateField('body') }]}
            required
          >
            <Input.TextArea autoSize={{ minRows: 4 }} />
          </Form.Item>

          <Form.Item
            label="reCAPTCHA"
            name="recaptchaResponse"
            rules={[{ validator: validateField('recaptchaResponse') }]}
            required
          >
            {recaptchaSiteKey ? (
              <ReCAPTCHA
                sitekey={recaptchaSiteKey}
                onChange={(value) =>
                  form.setFieldValue('recaptchaResponse', value || '')
                }
                onExpired={() => form.setFieldValue('recaptchaResponse', '')}
              />
            ) : (
              <div style={{ color: 'red' }}>RECAPTCHA site key not set yet</div>
            )}
          </Form.Item>

          <Form.Item>
            <Button type="primary" style={{ float: 'right' }} htmlType="submit">
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
