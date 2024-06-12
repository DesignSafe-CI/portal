import { Form, Input, Button, FormInstance } from 'antd';
import React, { useCallback, useEffect } from 'react';
import {
  facilityOptions,
  experimentTypeOptions,
  experimentEquipmentTypeOptions,
  simulationTypeOptions,
  HybridSimTypeOptions,
} from './ProjectFormDropdowns';

import {
  TBaseProjectValue,
  TProjectUser,
  useProjectDetail,
} from '@client/hooks';
import { customRequiredMark } from './_common';
import {
  DateInput,
  DropdownSelectSingleValue,
  ReferencedDataInput,
  RelatedWorkInput,
} from './_fields';

import * as constants from '../constants';
import { AuthorSelect } from './_fields/AuthorSelect';

const ExperimentFormFields: React.FC<{
  form: FormInstance;
  projectUsers: TProjectUser[];
}> = ({ form, projectUsers }) => {
  const facilityValue = Form.useWatch(['value', 'facility'], form);
  return (
    <>
      <Form.Item label="Experiment Title" required>
        This is the title of a stand-alone publication that will be shown in the
        citation with a DOI. Make sure to use a unique title, different from the
        project title. Use keyword terms and focus on the dataset that is being
        published.
        <Form.Item
          name={['value', 'title']}
          rules={[{ required: true }]}
          className="inner-form-item"
        >
          <Input />
        </Form.Item>
      </Form.Item>

      <Form.Item label="Date(s) of Experiment" required>
        If you only want to enter a single date, fill in the first field.
        <div style={{ display: 'flex' }}>
          <Form.Item
            name={['value', 'procedureStart']}
            rules={[{ required: true }]}
            className="inner-form-item"
          >
            <DateInput />
          </Form.Item>
          <span style={{ padding: '5px' }}>―</span>
          <Form.Item
            name={['value', 'procedureEnd']}
            className="inner-form-item"
          >
            <DateInput />
          </Form.Item>
        </div>
      </Form.Item>

      <Form.Item label="Experimental Facility">
        <Form.Item className="inner-form-item" name={['value', 'facility']}>
          <DropdownSelectSingleValue
            options={facilityOptions}
            placeholder="Select an experimental facility, or enter a custom value"
          />
        </Form.Item>
      </Form.Item>

      {Object.keys(experimentTypeOptions).includes(facilityValue?.id) && (
        <Form.Item label="Experiment Type">
          <Form.Item
            className="inner-form-item"
            name={['value', 'experimentType']}
          >
            <DropdownSelectSingleValue
              placeholder="Select an experiment type, or enter a custom value"
              options={experimentTypeOptions[facilityValue.id]}
            />
          </Form.Item>
        </Form.Item>
      )}

      {Object.keys(experimentEquipmentTypeOptions).includes(
        facilityValue?.id
      ) && (
        <Form.Item label="Equipment Type">
          <Form.Item
            className="inner-form-item"
            name={['value', 'equipmentType']}
          >
            <DropdownSelectSingleValue
              placeholder="Select an equipment type, or enter a custom value"
              options={experimentEquipmentTypeOptions[facilityValue.id]}
            />
          </Form.Item>
        </Form.Item>
      )}

      <Form.Item label="Referenced Data and Software">
        Published data used in the creation of this dataset.
        <ReferencedDataInput name={['value', 'referencedData']} />
      </Form.Item>

      <Form.Item label="Related Work">
        Information giving context, a linked dataset on DesignSafe, or works
        citing the DOI for this dataset.
        <RelatedWorkInput name={['value', 'relatedWork']} />
      </Form.Item>

      <Form.Item label="Experiment Description" required>
        What was under investigation? How was it tested? What was the outcome?
        How can the data be reused? Description must be between 50 and 5000
        characters in length.
        <Form.Item
          name={['value', 'description']}
          className="inner-form-item"
          rules={[{ min: 50 }, { required: true }]}
        >
          <Input.TextArea autoSize={{ minRows: 4 }} />
        </Form.Item>
      </Form.Item>

      <Form.Item label="Assign Authorship" required>
        You can order the authors during the publication process.
        <Form.Item
          name={['value', 'authors']}
          className="inner-form-item"
          rules={[{ required: true }]}
        >
          <AuthorSelect projectUsers={projectUsers} />
        </Form.Item>
      </Form.Item>
    </>
  );
};

const SimulationFormFields: React.FC<{
  projectUsers: TProjectUser[];
}> = ({ projectUsers }) => {
  return (
    <>
      <Form.Item label="Simulation Title" required>
        This is the title of a stand-alone publication that will be shown in the
        citation with a DOI. Make sure to use a unique title, different from the
        project title. Use keyword terms and focus on the dataset that is being
        published.
        <Form.Item
          name={['value', 'title']}
          rules={[{ required: true }]}
          className="inner-form-item"
        >
          <Input />
        </Form.Item>
      </Form.Item>

      <Form.Item label="Simulation Type" required>
        <Form.Item
          className="inner-form-item"
          name={['value', 'simulationType']}
          rules={[{ required: true }]}
        >
          <DropdownSelectSingleValue
            options={simulationTypeOptions}
            placeholder="Select a simulation type, or enter a custom value"
          />
        </Form.Item>
      </Form.Item>

      <Form.Item label="Facility">
        <Form.Item className="inner-form-item" name={['value', 'facility']}>
          <DropdownSelectSingleValue
            options={facilityOptions}
            placeholder="Select a facility, or enter a custom value"
          />
        </Form.Item>
      </Form.Item>

      <Form.Item label="Referenced Data and Software">
        Published data used in the creation of this dataset.
        <ReferencedDataInput name={['value', 'referencedData']} />
      </Form.Item>

      <Form.Item label="Related Work">
        Information giving context, a linked dataset on DesignSafe, or works
        citing the DOI for this dataset.
        <RelatedWorkInput name={['value', 'relatedWork']} />
      </Form.Item>

      <Form.Item label="Simulation Description" required>
        What was under investigation? How was it tested? What was the outcome?
        How can the data be reused? Description must be between 50 and 5000
        characters in length.
        <Form.Item
          name={['value', 'description']}
          className="inner-form-item"
          rules={[{ min: 50 }, { required: true }]}
        >
          <Input.TextArea autoSize={{ minRows: 4 }} />
        </Form.Item>
      </Form.Item>

      <Form.Item label="Assign Authorship" required>
        You can order the authors during the publication process.
        <Form.Item
          name={['value', 'authors']}
          className="inner-form-item"
          rules={[{ required: true }]}
        >
          <AuthorSelect projectUsers={projectUsers} />
        </Form.Item>
      </Form.Item>
    </>
  );
};

const HybridSimFormFields: React.FC<{
  projectUsers: TProjectUser[];
}> = ({ projectUsers }) => {
  return (
    <>
      <Form.Item label="Hybrid Simulation Title" required>
        This is the title of a stand-alone publication that will be shown in the
        citation with a DOI. Make sure to use a unique title, different from the
        project title. Use keyword terms and focus on the dataset that is being
        published.
        <Form.Item
          name={['value', 'title']}
          rules={[{ required: true }]}
          className="inner-form-item"
        >
          <Input />
        </Form.Item>
      </Form.Item>

      <Form.Item label="Hybrid Simulation Type" required>
        <Form.Item
          className="inner-form-item"
          name={['value', 'simulationType']}
          rules={[{ required: true }]}
        >
          <DropdownSelectSingleValue
            options={HybridSimTypeOptions}
            placeholder="Select a simulation type, or enter a custom value"
          />
        </Form.Item>
      </Form.Item>

      <Form.Item label="Facility">
        <Form.Item className="inner-form-item" name={['value', 'facility']}>
          <DropdownSelectSingleValue
            options={facilityOptions}
            placeholder="Select a facility, or enter a custom value"
          />
        </Form.Item>
      </Form.Item>

      <Form.Item label="Referenced Data and Software">
        Published data used in the creation of this dataset.
        <ReferencedDataInput name={['value', 'referencedData']} />
      </Form.Item>

      <Form.Item label="Related Work">
        Information giving context, a linked dataset on DesignSafe, or works
        citing the DOI for this dataset.
        <RelatedWorkInput name={['value', 'relatedWork']} />
      </Form.Item>

      <Form.Item label="Simulation Description" required>
        What was under investigation? How was it tested? What was the outcome?
        How can the data be reused? Description must be between 50 and 5000
        characters in length.
        <Form.Item
          name={['value', 'description']}
          className="inner-form-item"
          rules={[{ min: 50 }, { required: true }]}
        >
          <Input.TextArea autoSize={{ minRows: 4 }} />
        </Form.Item>
      </Form.Item>

      <Form.Item label="Assign Authorship" required>
        You can order the authors during the publication process.
        <Form.Item
          name={['value', 'authors']}
          className="inner-form-item"
          rules={[{ required: true }]}
        >
          <AuthorSelect projectUsers={projectUsers} />
        </Form.Item>
      </Form.Item>
    </>
  );
};

const MissionFormFields: React.FC<{
  projectUsers: TProjectUser[];
}> = ({ projectUsers }) => {
  return (
    <>
      <Form.Item label="Mission Title" required>
        This is the title of a stand-alone publication that will be shown in the
        citation with a DOI. Make sure to use a unique title, different from the
        project title. Use keyword terms and focus on the dataset that is being
        published.
        <Form.Item
          name={['value', 'title']}
          rules={[{ required: true }]}
          className="inner-form-item"
        >
          <Input />
        </Form.Item>
      </Form.Item>

      <Form.Item label="Event">
        The natural hazard event this mission is associated with.
        <Form.Item className="inner-form-item" name={['value', 'event']}>
          <Input />
        </Form.Item>
      </Form.Item>

      <Form.Item label="Date(s) of Mission" required>
        If you only want to enter a single date, fill in the first field.
        <div style={{ display: 'flex' }}>
          <Form.Item
            name={['value', 'dateStart']}
            rules={[{ required: true }]}
            className="inner-form-item"
          >
            <DateInput />
          </Form.Item>
          <span style={{ padding: '5px' }}>―</span>
          <Form.Item name={['value', 'dateEnd']} className="inner-form-item">
            <DateInput />
          </Form.Item>
        </div>
      </Form.Item>

      <Form.Item label="Facility">
        <Form.Item className="inner-form-item" name={['value', 'facility']}>
          <DropdownSelectSingleValue
            options={facilityOptions}
            placeholder="Select a facility, or enter a custom value"
          />
        </Form.Item>
      </Form.Item>

      <Form.Item label="Referenced Data and Software">
        Published data used in the creation of this dataset.
        <ReferencedDataInput name={['value', 'referencedData']} />
      </Form.Item>

      <Form.Item label="Related Work">
        Information giving context, a linked dataset on DesignSafe, or works
        citing the DOI for this dataset.
        <RelatedWorkInput name={['value', 'relatedWork']} />
      </Form.Item>

      <Form.Item label="Assign Authorship" required>
        You can order the authors during the publication process.
        <Form.Item
          name={['value', 'authors']}
          className="inner-form-item"
          rules={[{ required: true }]}
        >
          <AuthorSelect projectUsers={projectUsers} />
        </Form.Item>
      </Form.Item>

      <Form.Item label="Mission Site Location">
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

      <Form.Item label="Mission Description" required>
        What was under investigation? How was it tested? What was the outcome?
        How can the data be reused? Description must be between 50 and 5000
        characters in length.
        <Form.Item
          name={['value', 'description']}
          className="inner-form-item"
          rules={[{ min: 50 }, { required: true }]}
        >
          <Input.TextArea autoSize={{ minRows: 4 }} />
        </Form.Item>
      </Form.Item>
    </>
  );
};

const DocumentFormFields: React.FC<{
  projectUsers: TProjectUser[];
}> = ({ projectUsers }) => {
  return (
    <>
      <Form.Item label="Document Title" required>
        This is the title of a stand-alone publication that will be shown in the
        citation with a DOI. Make sure to use a unique title, different from the
        project title. Use keyword terms and focus on the dataset that is being
        published.
        <Form.Item
          name={['value', 'title']}
          rules={[{ required: true }]}
          className="inner-form-item"
        >
          <Input />
        </Form.Item>
      </Form.Item>

      <Form.Item label="Facility">
        <Form.Item className="inner-form-item" name={['value', 'facility']}>
          <DropdownSelectSingleValue
            options={facilityOptions}
            placeholder="Select a facility, or enter a custom value"
          />
        </Form.Item>
      </Form.Item>

      <Form.Item label="Referenced Data and Software">
        Published data used in the creation of this dataset.
        <ReferencedDataInput name={['value', 'referencedData']} />
      </Form.Item>

      <Form.Item label="Related Work">
        Information giving context, a linked dataset on DesignSafe, or works
        citing the DOI for this dataset.
        <RelatedWorkInput name={['value', 'relatedWork']} />
      </Form.Item>

      <Form.Item label="Assign Authorship" required>
        You can order the authors during the publication process.
        <Form.Item
          name={['value', 'authors']}
          className="inner-form-item"
          rules={[{ required: true }]}
        >
          <AuthorSelect projectUsers={projectUsers} />
        </Form.Item>
      </Form.Item>

      <Form.Item label="Mission Description" required>
        What was under investigation? How was it tested? What was the outcome?
        How can the data be reused? Description must be between 50 and 5000
        characters in length.
        <Form.Item
          name={['value', 'description']}
          className="inner-form-item"
          rules={[{ min: 50 }, { required: true }]}
        >
          <Input.TextArea autoSize={{ minRows: 4 }} />
        </Form.Item>
      </Form.Item>
    </>
  );
};

export const PublishableEntityForm: React.FC<{
  projectType: TBaseProjectValue['projectType'];
  entityName?: string;
  projectId: string;
  entityUuid?: string;
  mode: 'create' | 'edit';
  onSubmit: CallableFunction;
}> = ({
  projectType,
  projectId,
  entityUuid,
  entityName,
  onSubmit,
  mode = 'edit',
}) => {
  const [form] = Form.useForm();
  const { data } = useProjectDetail(projectId ?? '');

  const entity = data?.entities.find((e) => e.uuid === entityUuid);
  const entityDisplayName = entityName
    ? constants.DISPLAY_NAMES[entityName]
    : 'Category';

  const setValues = useCallback(() => {
    if (data && entity && mode === 'edit') {
      form.setFieldsValue({ value: entity.value });
    }
  }, [data, form, entity, mode]);
  useEffect(() => setValues(), [setValues, projectId]);

  if (!data) return <div>Loading</div>;
  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={(v) => {
        onSubmit(v.value);
        if (mode === 'create') {
          form.resetFields();
        }
      }}
      requiredMark={customRequiredMark}
    >
      {projectType === 'experimental' && (
        <ExperimentFormFields
          form={form}
          projectUsers={data.baseProject.value.users}
        />
      )}
      {projectType === 'simulation' && (
        <SimulationFormFields projectUsers={data.baseProject.value.users} />
      )}
      {projectType === 'hybrid_simulation' && (
        <HybridSimFormFields projectUsers={data.baseProject.value.users} />
      )}
      {entityName === constants.FIELD_RECON_MISSION && (
        <MissionFormFields projectUsers={data.baseProject.value.users} />
      )}
      {entityName === constants.FIELD_RECON_REPORT && (
        <DocumentFormFields projectUsers={data.baseProject.value.users} />
      )}

      <Form.Item style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" className="success-button" htmlType="submit">
          {mode === 'create' ? (
            <span>
              <i role="none" className="fa fa-plus"></i> Add {entityDisplayName}
            </span>
          ) : (
            <span>Update</span>
          )}
        </Button>
      </Form.Item>
    </Form>
  );
};
