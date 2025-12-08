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
    .typeError('Latitude must be a number')
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90')
    .required('Required'),
  longitude: Yup.number()
    .typeError('Longitude must be a number')
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
    .required('Required'),
  body: Yup.string()
    .required('Required')
    .min(10, 'Description must be at least 10 characters'),
  recaptchaResponse: Yup.string().required('Please complete the reCAPTCHA'),
};

const formSchema = Yup.object().shape(formShape);

const getFieldError = (errors: any, touched: any, field: string) => {
  const hasError = errors[field] && touched[field];
  return {
    validateStatus: hasError ? ('error' as const) : undefined,
    help: hasError ? String(errors[field]) : '',
  };
};

export const ContributeDataModal: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { Link } = Typography;
  const recaptchaSiteKey = (window as any).__RECAPTCHA_SITE_KEY__ || '';

  const showModal = () => setIsModalOpen(true);
  const handleClose = () => {
    setIsModalOpen(false);
  };

  const { mutate } = useCreateFeedbackTicket(
    'RECON-PORTAL',
    'Data Contribution'
  ); // not sure if it will suffice, need to pass projectId adn title into useCreateFeedbackTicket, or create new hook?
  const [notifApi, contextHolder] = notification.useNotification();

  const handleSubmit = (
    formData: {
      name: string;
      email: string;
      dateOfHazard: string;
      eventTitle: string;
      url: string;
      latitude: number;
      longitude: number;
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

    mutate(
      {
        formData: {
          name: formData.name,
          email: formData.email,
          body: formattedBody,
          projectId: 'RECON-PORTAL',
          title: 'Data Contribution',
          recaptchaToken: formData.recaptchaResponse,
        },
      },
      {
        onSuccess: () => {
          resetForm();
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
    latitude: '' as any,
    longitude: '' as any,
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
          <Formik
            initialValues={initialValues}
            validationSchema={formSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({
              errors,
              touched,
              getFieldProps,
              setFieldValue,
              isSubmitting,
            }) => (
              <FormikForm
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                <Form.Item
                  label="Full Name"
                  required
                  {...getFieldError(errors, touched, 'name')}
                >
                  <Input {...getFieldProps('name')} />
                </Form.Item>

                <Form.Item
                  label="Email"
                  required
                  {...getFieldError(errors, touched, 'email')}
                >
                  <Input type="email" {...getFieldProps('email')} />
                </Form.Item>

                <Form.Item
                  label="Date of Hazard Event"
                  required
                  {...getFieldError(errors, touched, 'dateOfHazard')}
                >
                  <Input {...getFieldProps('dateOfHazard')} />
                </Form.Item>

                <Form.Item
                  label="Event Title"
                  required
                  {...getFieldError(errors, touched, 'eventTitle')}
                >
                  <Input {...getFieldProps('eventTitle')} />
                </Form.Item>

                <Form.Item
                  label="URL to Data"
                  required
                  {...getFieldError(errors, touched, 'url')}
                >
                  <Input {...getFieldProps('url')} />
                </Form.Item>

                <Form.Item
                  label="Latitude"
                  required
                  {...getFieldError(errors, touched, 'latitude')}
                >
                  <Input
                    {...getFieldProps('latitude')}
                    onChange={(e) => {
                      const val = e.target.value;
                      const num = Number(val);
                      setFieldValue(
                        'latitude',
                        val === '' || isNaN(num) ? val : num
                      );
                    }}
                  />
                </Form.Item>

                <Form.Item
                  label="Longitude"
                  required
                  {...getFieldError(errors, touched, 'longitude')}
                >
                  <Input
                    {...getFieldProps('longitude')}
                    onChange={(e) => {
                      const val = e.target.value;
                      const num = Number(val);
                      setFieldValue(
                        'longitude',
                        val === '' || isNaN(num) ? val : num
                      );
                    }}
                  />
                </Form.Item>

                <Form.Item
                  label="Brief Description"
                  required
                  {...getFieldError(errors, touched, 'body')}
                >
                  <Input.TextArea
                    {...getFieldProps('body')}
                    autoSize={{ minRows: 4 }}
                  />
                </Form.Item>

                <Form.Item
                  label="reCAPTCHA"
                  required
                  {...getFieldError(errors, touched, 'recaptchaResponse')}
                >
                  {recaptchaSiteKey ? (
                    <ReCAPTCHA
                      sitekey={recaptchaSiteKey}
                      onChange={(value) =>
                        setFieldValue('recaptchaResponse', value || '')
                      }
                      onExpired={() => setFieldValue('recaptchaResponse', '')}
                    />
                  ) : (
                    <div style={{ color: 'red' }}>
                      RECAPTCHA site key not set yet
                    </div>
                  )}
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    style={{ float: 'right' }}
                    htmlType="submit"
                    loading={isSubmitting}
                  >
                    Submit
                  </Button>
                </Form.Item>
              </FormikForm>
            )}
          </Formik>
        </div>
      </Modal>
    </>
  );
};
