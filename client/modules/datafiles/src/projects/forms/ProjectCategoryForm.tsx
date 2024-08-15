import { Form, Input, Button, Select, Checkbox } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import {
  equipmentOptions,
  observationTypeOptions,
} from './ProjectFormDropdowns';

//import { TProjectUser } from './_fields/UserSelect';
import {
  TBaseProjectValue,
  TProjectUser,
  useProjectDetail,
} from '@client/hooks';
import { customRequiredMark } from './_common';
import { CATEGORIES_BY_PROJECT_TYPE, DISPLAY_NAMES } from '../constants';
import * as constants from '../constants';
import { DateInput, DropdownSelect, SampleApproachInput } from './_fields';
import { CollectionModeInput } from './_fields/CollectionModeInput';

const AuthorSelect: React.FC<{
  projectUsers: TProjectUser[];
  value?: TProjectUser[];
  onChange?: (value: TProjectUser[]) => void;
}> = ({ value, onChange, projectUsers }) => {
  const options = projectUsers.map((author) => ({
    value: JSON.stringify(author),
    label: `${author.fname} ${author.lname} (${author.email})`,
  }));

  const onChangeCallback = useCallback(
    (value: string[]) => {
      if (onChange) onChange(value.map((a) => JSON.parse(a)));
    },
    [onChange]
  );

  return (
    <Checkbox.Group
      value={projectUsers
        .filter((user) => value?.some((v) => user.email === v.email))
        .map((v) => JSON.stringify(v) ?? [])}
      options={options}
      onChange={onChangeCallback}
    />
  );
};

export const ProjectCategoryForm: React.FC<{
  projectType: TBaseProjectValue['projectType'];
  projectId: string;
  entityUuid?: string;
  mode: 'create' | 'edit';
}> = ({ projectType, projectId, entityUuid, mode = 'edit' }) => {
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

  const category = data?.entities.find((e) => e.uuid === entityUuid);

  const setValues = useCallback(() => {
    if (data && category && mode === 'edit') {
      form.setFieldsValue({ value: category.value });
      setSelectedName(category.name);
    }
  }, [data, form, category, mode]);
  useEffect(() => setValues(), [setValues, projectId, category?.uuid]);

  if (!data) return <div>Loading</div>;
  return (
    <Form
      form={form}
      onValuesChange={(_, v) => setSelectedName(v.name)}
      layout="vertical"
      onFinish={(v) => console.log(v)}
      requiredMark={customRequiredMark}
    >
      {mode === 'create' && (
        <Form.Item label="Category Type" required>
          Model Configuration Files describing the design and layout of what is
          being tested (some call this a specimen). Sensor Information Files
          about the sensor instrumentation used in a model configuration to
          conduct one or more event. Event Files from unique occurrences during
          which data are generated. Analysis Tables, graphs, visualizations,
          Jupyter Notebooks, or other representations of the results. Report
          Written accounts made to convey information about an entire project or
          experiment.
          <Form.Item
            name="name"
            rules={[{ required: true }]}
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
          rules={[{ required: true }]}
          className="inner-form-item"
        >
          <Input />
        </Form.Item>
      </Form.Item>

      {selectedName === constants.FIELD_RECON_PLANNING && (
        <Form.Item label="Data Collectors">
          Select data collectors for this collection.
          <Form.Item
            name={['value', 'dataCollectors']}
            className="inner-form-item"
          >
            <AuthorSelect projectUsers={data.baseProject.value.users} />
          </Form.Item>
        </Form.Item>
      )}

      {selectedName === constants.FIELD_RECON_GEOSCIENCE && (
        <>
          <Form.Item label="Observation Type" required>
            The nature or subject of the data collected.
            <Form.Item
              name={['value', 'observationTypes']}
              className="inner-form-item"
              rules={[{ required: true }]}
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
                rules={[{ required: true }]}
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

          <Form.Item label="Data Collectors">
            Select data collectors for this collection.
            <Form.Item
              name={['value', 'dataCollectors']}
              className="inner-form-item"
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
            The equipment used to gather your data.
            <Form.Item
              name={['value', 'equipment']}
              className="inner-form-item"
              rules={[{ required: true }]}
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
                rules={[{ required: true }]}
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

          <Form.Item label="Data Collectors">
            Select data collectors for this collection.
            <Form.Item
              name={['value', 'dataCollectors']}
              className="inner-form-item"
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
            The equipment used to gather your data.
            <Form.Item
              name={['value', 'equipment']}
              className="inner-form-item"
              rules={[{ required: true }]}
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

      <Form.Item label="Description">
        Summarize the purpose of the category and its files. What is it about?
        What are its features? Description must be between 50 and 5000
        characters in length.
        <Form.Item
          name={['value', 'description']}
          className="inner-form-item"
          rules={[{ min: 50 }]}
        >
          <Input.TextArea autoSize={{ minRows: 4 }} />
        </Form.Item>
      </Form.Item>

      <Form.Item style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" className="success-button" htmlType="submit">
          {mode === 'create' ? (
            <span>
              <i role="none" className="fa fa-plus"></i>
              Add Category
            </span>
          ) : (
            <span>Update</span>
          )}
        </Button>
      </Form.Item>
    </Form>
  );
};
