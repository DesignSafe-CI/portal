import { Button, Checkbox, Form, Input, Modal, Radio } from 'antd';
import React, { useCallback, useEffect } from 'react';
import { customRequiredMark } from '../../projects/forms/_common';
import { useParams } from 'react-router-dom';
import { apiClient } from '@client/hooks';

type TMicrosurveyFormData = {
  projectId: string;
  reasons: string[];
  didCollect: boolean;
  professionalLevel: string;
  comments: string;
  reasonCustom: string;
  professionalLevelCustom: string;
};

type TMicrosurveyPostBody = {
  projectId: string;
  reasons: string[];
  didCollect: boolean;
  professionalLevel: string;
  comments: string;
};

function submitMicrosurvey(
  body: TMicrosurveyPostBody,
  closeCallback: CallableFunction
) {
  closeCallback();
  apiClient.post('/api/datafiles/microsurvey/', body);
}

export const MicrosurveyModal: React.FC<{
  isModalOpen: boolean;
  setIsModalOpen: CallableFunction;
}> = ({ isModalOpen, setIsModalOpen }) => {
  const handleCancel = useCallback(() => {
    setIsModalOpen(false);
  }, [setIsModalOpen]);

  const { projectId } = useParams() as { projectId: string };
  const [form] = Form.useForm<TMicrosurveyFormData>();

  useEffect(() => {
    form.resetFields();
  }, [form, projectId, isModalOpen]);

  const onSubmit = useCallback(
    (formData: TMicrosurveyFormData) => {
      const body = {
        projectId: projectId,
        reasons: formData.reasonCustom
          ? [...formData.reasons, formData.reasonCustom].filter(
              (r) => r !== 'Other(please specify)'
            )
          : formData.reasons,
        didCollect: formData.didCollect,
        professionalLevel:
          formData.professionalLevelCustom ?? formData.professionalLevel,
        comments: formData.comments ?? '',
      };
      submitMicrosurvey(body, handleCancel);
    },
    [projectId, handleCancel]
  );

  const reasonOptions = [
    'Integration with other datasets for analysis',
    'Train AI/ML algorithm',
    'Validate/calibrate numerical model',
    'Use data for simulation input',
    'Education',
    'Other(please specify)',
  ];

  const professionalLevelOptions = [
    'Undergraduate Student',
    'Graduate student',
    'Postdoctoral researcher',
    'Faculty or Researcher',
    'Staff (support, administration, etc.)',
    'Practicing Engineer or Architect',
    'Other(please specify)',
  ];

  return (
    <Modal
      open={isModalOpen}
      width={800}
      title={<h3>DesignSafe User Data Download Microsurvey</h3>}
      onCancel={handleCancel}
      cancelButtonProps={{ hidden: true }}
      okButtonProps={{ hidden: true }}
    >
      <p>
        While your data is downloading, please helps us support the natural
        hazards community by completing this anonymous survey. This will help
        the researcher who published the data understand where their data is
        being used and it will help us to improve our metrics reports to the
        NSF. Thank you for your participation.
      </p>
      <Form
        onFinish={onSubmit}
        form={form}
        layout="vertical"
        requiredMark={customRequiredMark}
      >
        <Form.Item
          rules={[
            { required: true, message: 'Please select at least one reason.' },
          ]}
          name="reasons"
          label={
            <>
              Reason(s) you download data from DesignSafe (Select all that
              apply)
            </>
          }
        >
          <Checkbox.Group
            style={{ flexDirection: 'column' }}
            options={reasonOptions}
          ></Checkbox.Group>
        </Form.Item>
        <Form.Item
          noStyle
          shouldUpdate={(prev, curr) => prev.reasons !== curr.reasons}
        >
          {({ getFieldValue }) =>
            (getFieldValue('reasons') ?? []).includes(
              'Other(please specify)'
            ) ? (
              <Form.Item
                name="reasonCustom"
                label="Specify the reason you are downloading this dataset."
                rules={[{ required: true, message: 'This field is required.' }]}
              >
                <Input />
              </Form.Item>
            ) : null
          }
        </Form.Item>

        <Form.Item
          name="didCollect"
          label="Did you participate in collecting/publishing this data?"
          rules={[
            {
              required: true,
              message:
                'Please indicate whether you participated in data collection.',
            },
          ]}
        >
          <Radio.Group
            options={[
              { value: true, label: 'Yes' },
              { value: false, label: 'No' },
            ]}
          />
        </Form.Item>
        <Form.Item
          name="professionalLevel"
          label="Professional Level"
          rules={[
            {
              required: true,
              message: 'Please select a professional level.',
            },
          ]}
        >
          <Radio.Group
            style={{ display: 'flex', flexDirection: 'column' }}
            options={professionalLevelOptions}
          />
        </Form.Item>
        <Form.Item
          noStyle
          shouldUpdate={(prev, curr) =>
            prev.professionalLevel !== curr.professionalLevel
          }
        >
          {({ getFieldValue }) =>
            getFieldValue('professionalLevel') === 'Other(please specify)' ? (
              <Form.Item
                name="professionalLevelCustom"
                label="Specify your current professional level."
                rules={[{ required: true, message: 'This field is required.' }]}
              >
                <Input />
              </Form.Item>
            ) : null
          }
        </Form.Item>
        <Form.Item
          name="comments"
          label="Please share any additional comments you have on data downloads, processes, or uses."
        >
          <Input.TextArea autoSize={{ minRows: 4 }} />
        </Form.Item>
        <Button type="primary" htmlType="submit">
          Submit
        </Button>
      </Form>
    </Modal>
  );
};
