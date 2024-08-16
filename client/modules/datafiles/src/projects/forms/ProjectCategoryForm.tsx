import { Form, Input, Button, Select, Alert } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import {
  equipmentOptions,
  observationTypeOptions,
} from './ProjectFormDropdowns';

//import { TProjectUser } from './_fields/UserSelect';
import { TBaseProjectValue, useProjectDetail } from '@client/hooks';
import { customRequiredMark } from './_common';
import { CATEGORIES_BY_PROJECT_TYPE, DISPLAY_NAMES } from '../constants';
import * as constants from '../constants';
import { DateInput, DropdownSelect, SampleApproachInput } from './_fields';
import { CollectionModeInput } from './_fields/CollectionModeInput';
import { AuthorSelect } from './_fields/AuthorSelect';
import { ProjectCategoryFormHelp } from './ProjectCategoryFormHelp';

export const ProjectCategoryForm: React.FC<{
  projectType: TBaseProjectValue['projectType'];
  projectId: string;
  entityUuid?: string;
  mode: 'create' | 'edit';
  onSubmit: CallableFunction;
  onCancelEdit: CallableFunction;
}> = ({
  projectType,
  projectId,
  entityUuid,
  mode = 'edit',
  onSubmit,
  onCancelEdit,
}) => {
  const [form] = Form.useForm();
  const { data } = useProjectDetail(projectId ?? '');
  const [selectedName, setSelectedName] = useState<string | undefined>(
    undefined
  );

  const categoryNames = CATEGORIES_BY_PROJECT_TYPE[projectType] ?? [];
  const categoryOptions = categoryNames.map((name) => ({
    value: name,
    label: DISPLAY_NAMES[name],
  }));

  const category = useMemo(
    () => data?.entities.find((e) => e.uuid === entityUuid),
    [data, entityUuid]
  );

  const [hasValidationErrors, setHasValidationErrors] = useState(false);

  // Set initial form values
  useEffect(() => {
    if (data && category && mode === 'edit') {
      form.setFieldsValue({ value: category.value });
      setSelectedName(category.name);
    }
    setHasValidationErrors(false);
  }, [projectId, category, data, form, mode]);

  if (!data) return null;
  return (
    <Form
      scrollToFirstError={{ behavior: 'smooth' }}
      form={form}
      onValuesChange={(_, v) => mode === 'create' && setSelectedName(v.name)}
      layout="vertical"
      onFinish={(v) => {
        onSubmit(v);
        form.resetFields();
        setSelectedName(undefined);
        onCancelEdit();
        setHasValidationErrors(false);
      }}
      onFinishFailed={() => setHasValidationErrors(true)}
      requiredMark={customRequiredMark}
    >
      {mode === 'create' && (
        <Form.Item label="Category Type" required>
          <article style={{ margin: '5px 0px' }}>
            <ProjectCategoryFormHelp projectType={projectType} />
          </article>
          <Form.Item
            name="name"
            rules={[
              {
                required: true,
                message: 'Please select a category', // Custom error message
              },
            ]}
            className="inner-form-item"
          >
            <Select options={categoryOptions} placeholder="Select a Category" />
          </Form.Item>
        </Form.Item>
      )}
      <Form.Item label="Title" required>
        Make it unique from other categories. Use sequential ordering if
        necessary. Do not repeat the category type in the title.
        <Form.Item
          name={['value', 'title']}
          rules={[
            {
              required: true,
              message: 'Please enter a title', // Custom error message
            },
          ]}
          className="inner-form-item"
        >
          <Input />
        </Form.Item>
      </Form.Item>

      {selectedName === constants.FIELD_RECON_PLANNING && (
        <Form.Item label="Data Collectors" required>
          Select data collectors for this collection.
          <Form.Item
            name={['value', 'dataCollectors']}
            className="inner-form-item"
            rules={[
              {
                required: true,
                message: 'Please select at least one data collector.',
              },
            ]}
          >
            <AuthorSelect projectUsers={data.baseProject.value.users} />
          </Form.Item>
        </Form.Item>
      )}

      {selectedName === constants.FIELD_RECON_GEOSCIENCE && (
        <>
          <Form.Item label="Observation Type" required>
            The nature or subject of the data collected. Enter a custom value by
            typing it into the field and pressing "return".
            <Form.Item
              name={['value', 'observationTypes']}
              className="inner-form-item"
              rules={[
                {
                  required: true,
                  message: 'Please select/enter an observation type', // Custom error message
                },
              ]}
            >
              <DropdownSelect options={observationTypeOptions} />
            </Form.Item>
          </Form.Item>

          <Form.Item label="Date(s) of Collection" required>
            When the data in this collection was gathered. If you only want to
            enter a single date, fill in the first field.
            <div style={{ display: 'inline-flex' }}>
              <Form.Item
                name={['value', 'dateStart']}
                rules={[
                  {
                    required: true,
                    message: 'Please enter a start date', // Custom error message
                  },
                ]}
                className="inner-form-item"
              >
                <DateInput />
              </Form.Item>
              <span style={{ padding: '5px' }}>―</span>
              <Form.Item
                name={['value', 'dateEnd']}
                className="inner-form-item"
              >
                <DateInput />
              </Form.Item>
            </div>
          </Form.Item>

          <Form.Item label="Data Collectors" required>
            Select data collectors for this collection.
            <Form.Item
              name={['value', 'dataCollectors']}
              className="inner-form-item"
              rules={[
                {
                  required: true,
                  message: 'Please select at least one data collector.',
                },
              ]}
            >
              <AuthorSelect projectUsers={data.baseProject.value.users} />
            </Form.Item>
          </Form.Item>

          <Form.Item label="Collection Site Location">
            <div style={{ display: 'inline-flex', gap: '1rem', width: '100%' }}>
              <Form.Item
                name={['value', 'location']}
                label="Geolocation"
                style={{ flex: 2 }}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name={['value', 'latitude']}
                label="Latitude"
                style={{ flex: 1 }}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name={['value', 'longitude']}
                label="Longitude"
                style={{ flex: 1 }}
              >
                <Input />
              </Form.Item>
            </div>
          </Form.Item>

          <Form.Item label="Equipment" required>
            The equipment used to gather your data. Enter a custom value by
            typing it into the field and pressing "return".
            <Form.Item
              name={['value', 'equipment']}
              className="inner-form-item"
              rules={[
                {
                  required: true,
                  message:
                    'Please select/enter at least one piece of equipment', // Custom error message
                },
              ]}
            >
              <DropdownSelect options={equipmentOptions} />
            </Form.Item>
          </Form.Item>
        </>
      )}

      {selectedName === constants.FIELD_RECON_SOCIAL_SCIENCE && (
        <>
          <Form.Item label="Unit of Analysis">
            A description of who or what is being studied.
            <Form.Item name={['value', 'unit']} className="inner-form-item">
              <Input />
            </Form.Item>
          </Form.Item>

          <Form.Item label="Mode(s) of Collection">
            The procedure/technique of the inquiry used to obtain the data.
            <CollectionModeInput name={['value', 'modes']} />
          </Form.Item>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <Form.Item label="Sampling Approach(es)" style={{ flex: 2 }}>
              Methods used to sample the population.
              <SampleApproachInput name={['value', 'sampleApproach']} />
            </Form.Item>
            <Form.Item label="Sample Size" style={{ flex: 1 }}>
              <Form.Item name={['value', 'sampleSize']} label="&nbsp;">
                <Input />
              </Form.Item>
            </Form.Item>
          </div>

          <Form.Item label="Date(s) of Collection" required>
            When the data in this collection was gathered. If you only want to
            enter a single date, fill in the first field.
            <div style={{ display: 'inline-flex' }}>
              <Form.Item
                name={['value', 'dateStart']}
                rules={[
                  {
                    required: true,
                    message: 'Please enter a start date', // Custom error message
                  },
                ]}
                className="inner-form-item"
              >
                <DateInput />
              </Form.Item>
              <span style={{ padding: '5px' }}>―</span>
              <Form.Item
                name={['value', 'dateEnd']}
                className="inner-form-item"
              >
                <DateInput />
              </Form.Item>
            </div>
          </Form.Item>

          <Form.Item label="Data Collectors" required>
            Select data collectors for this collection.
            <Form.Item
              name={['value', 'dataCollectors']}
              className="inner-form-item"
              rules={[
                {
                  required: true,
                  message: 'Please select at least one data collector.',
                },
              ]}
            >
              <AuthorSelect projectUsers={data.baseProject.value.users} />
            </Form.Item>
          </Form.Item>

          <Form.Item label="Collection Site Location">
            <div style={{ display: 'inline-flex', gap: '1rem', width: '100%' }}>
              <Form.Item
                name={['value', 'location']}
                label="Geolocation"
                style={{ flex: 2 }}
                className="inner-form-item"
              >
                <Input />
              </Form.Item>
              <Form.Item
                name={['value', 'latitude']}
                label="Latitude"
                style={{ flex: 1 }}
                className="inner-form-item"
              >
                <Input />
              </Form.Item>
              <Form.Item
                name={['value', 'longitude']}
                label="Longitude"
                style={{ flex: 1 }}
                className="inner-form-item"
              >
                <Input />
              </Form.Item>
            </div>
          </Form.Item>

          <Form.Item label="Equipment" required>
            The equipment used to gather your data. Enter a custom value by
            typing it into the field and pressing "return".
            <Form.Item
              name={['value', 'equipment']}
              className="inner-form-item"
              rules={[
                {
                  required: true,
                  message:
                    'Please select/enter at least one piece of equipment', // Custom error message
                },
              ]}
            >
              <DropdownSelect options={equipmentOptions} />
            </Form.Item>
          </Form.Item>

          <Form.Item label="Restriction">
            Information regarding limitations on use or restrictions on access
            to the data.
            <Form.Item
              name={['value', 'restriction']}
              className="inner-form-item"
            >
              <Input />
            </Form.Item>
          </Form.Item>
        </>
      )}

      <Form.Item label="Description" required>
        Summarize the purpose of the category and its files. What is it about?
        What are its features? Description must be between 50 and 5000
        characters in length.
        <Form.Item
          name={['value', 'description']}
          className="inner-form-item"
          rules={[
            {
              required: true,
              message: 'Please enter a description',
            },
            {
              min: 50,
              message: 'Description must be at least 50 characters long',
            },
            {
              max: 5000,
              message: 'Description cannot be longer than 5000 characters',
            },
          ]}
        >
          <Input.TextArea autoSize={{ minRows: 4 }} />
        </Form.Item>
      </Form.Item>

      {hasValidationErrors && (
        <Alert
          type="error"
          style={{ marginBottom: '10px' }}
          showIcon
          message={
            <span>
              One or more fields could not be validated. Please check the form
              for errors.
            </span>
          }
        />
      )}

      <Form.Item style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {mode === 'edit' && (
          <Button
            onClick={() => {
              onCancelEdit();
              form.resetFields();
              setHasValidationErrors(false);
            }}
            style={{ marginRight: '10px' }}
            type="link"
          >
            Cancel Editing
          </Button>
        )}
        <Button type="primary" className="success-button" htmlType="submit">
          {mode === 'create' ? (
            <span>
              <i role="none" className="fa fa-plus"></i> Add Category
            </span>
          ) : (
            <span>Update</span>
          )}
        </Button>
      </Form.Item>
    </Form>
  );
};
