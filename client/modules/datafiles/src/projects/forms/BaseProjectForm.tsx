import { Button, Form, Input, Select } from 'antd';
import React, { useCallback, useEffect, useMemo } from 'react';
import {
  nhTypeOptions,
  facilityOptions,
  dataTypeOptions,
  frTypeOptions,
} from './ProjectFormDropdowns';
import {
  UserSelect,
  DropdownSelect,
  GuestMembersInput,
  HazardEventsInput,
  AwardsInput,
  RelatedWorkInput,
  ReferencedDataInput,
} from './_fields';
import { TProjectUser } from './_fields/UserSelect';
import { TBaseProjectValue, useProjectDetail } from '@client/hooks';
import { customRequiredMark } from './_common';
import { AuthorSelect } from './_fields/AuthorSelect';
import { ChangeProjectTypeModal } from '../modals';
import { ProjectTypeRadioSelect } from '../modals/ProjectTypeRadioSelect';

export const ProjectTypeInput: React.FC<{
  projectType: TBaseProjectValue['projectType'];
}> = ({ projectType }) => {
  switch (projectType) {
    case 'experimental':
      return (
        <ProjectTypeRadioSelect
          label="Experimental Project"
          iconName="curation-experiment overview-prj-type"
          description="For physical work, typically done at an experimental facility or in the field."
        />
      );
    case 'simulation':
      return (
        <ProjectTypeRadioSelect
          label="Simulation Project"
          iconName="curation-simulation overview-prj-type"
          description="For numerical and/or analytical work, done with software."
        />
      );
    case 'field_recon':
      return (
        <ProjectTypeRadioSelect
          label="Field Research Project"
          iconName="curation-recon overview-prj-type"
          description="For work done in areas affected by natural hazards."
        />
      );
    case 'other':
      return (
        <ProjectTypeRadioSelect
          label="Other Type Project"
          iconName="curation-other overview-prj-type"
          description="For work other than the project types above."
        />
      );

    case 'hybrid_simulation':
      return (
        <ProjectTypeRadioSelect
          label="Hybrid Simulation Project"
          iconName="curation-hybrid overview-prj-type"
          description="For work using both physical and numerical components."
        />
      );
    default:
      return (
        <ProjectTypeRadioSelect
          label="None"
          iconName="curation-close-window manage-prj-types-icon"
          description="You have not selected a project type"
        />
      );
  }
};

export const BaseProjectForm: React.FC<{
  projectId: string;
  onChangeType?: () => void;
}> = ({ projectId, onChangeType }) => {
  const [form] = Form.useForm();
  const { data } = useProjectDetail(projectId ?? '');
  const projectType = data?.baseProject.value.projectType;

  function processFormData(formData: Record<string, TProjectUser[]>) {
    const { pi, coPis, teamMembers, guestMembers, ...rest } = formData;
    return {
      ...rest,
      users: [...pi, ...coPis, ...teamMembers, ...guestMembers],
    };
  }

  const setValues = useCallback(() => {
    if (data) form.setFieldsValue(cleanInitialvalues(data.baseProject.value));
  }, [data, form]);

  useEffect(() => {
    setValues();
  }, [setValues, projectId]);

  function cleanInitialvalues(projectData: TBaseProjectValue) {
    const { users, ...rest } = projectData;
    return {
      ...rest,
      pi: users.filter((u) => u.role === 'pi'),
      coPis: users.filter((u) => u.role === 'co_pi'),
      teamMembers: users.filter((u) => u.role === 'team_member'),
      guestMembers: users.filter((u) => u.role === 'guest'),
    };
  }

  const watchedValues = Form.useWatch([], form);
  const watchedUsers = useMemo(
    () => [
      ...(watchedValues?.pi ?? []),
      ...(watchedValues?.coPis ?? []),
      ...(watchedValues?.teamMembers ?? []),
      ...(watchedValues?.guestMembers ?? []),
    ],
    [
      watchedValues?.pi,
      watchedValues?.coPis,
      watchedValues?.teamMembers,
      watchedValues?.guestMembers,
    ]
  );

  if (!data) return <div>Loading</div>;
  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={(v) => console.log(processFormData(v))}
      onFinishFailed={(v) => console.log(processFormData(v.values))}
      requiredMark={customRequiredMark}
    >
      <Form.Item label="Project Title" required>
        Incorporate the project's focus with words indicating the hazard, model,
        system, and research approach. Define all acronyms.
        <Form.Item
          name="title"
          rules={[{ required: true }]}
          className="inner-form-item"
        >
          <Input />
        </Form.Item>
      </Form.Item>

      {/*TODO: disable in situations where project type shouldn't be changed.*/}
      <Form.Item label="Project Type">
        <ProjectTypeInput projectType={data.baseProject.value.projectType} />
        <ChangeProjectTypeModal projectId={projectId}>
          {({ onClick }) => (
            <Button
              onClick={(evt) => {
                onChangeType && onChangeType();
                onClick(evt);
              }}
              type="link"
            >
              <strong>Change Project Type</strong>
            </Button>
          )}
        </ChangeProjectTypeModal>
      </Form.Item>

      {projectType === 'field_recon' && (
        <Form.Item label="Field Research Type" required>
          Specify the Field Research being performed.
          <Form.Item
            name="frTypes"
            className="inner-form-item"
            rules={[{ required: true }]}
          >
            <DropdownSelect options={frTypeOptions} />
          </Form.Item>
        </Form.Item>
      )}

      <Form.Item label="Natural Hazard Types" required>
        Specify the natural hazard being researched.
        <Form.Item
          name="nhTypes"
          className="inner-form-item"
          rules={[{ required: true }]}
        >
          <DropdownSelect options={nhTypeOptions} />
        </Form.Item>
      </Form.Item>

      {projectType === 'other' && (
        <>
          <Form.Item label="Data Types" required>
            The nature or genre of the content.
            <Form.Item
              className="inner-form-item"
              name="dataTypes"
              rules={[{ required: true }]}
            >
              <DropdownSelect options={dataTypeOptions} />
            </Form.Item>
          </Form.Item>

          <Form.Item label="Facilities">
            Specify the facilities involved in this research.
            <Form.Item
              className="inner-form-item"
              name="facilities"
              initialValue={[]}
            >
              <DropdownSelect options={facilityOptions} />
            </Form.Item>
          </Form.Item>
        </>
      )}

      <div style={{ display: 'flex', gap: '1rem' }}>
        <Form.Item label="Principal Investigator" required className="flex-1">
          These users can view, edit, curate, and publish. Include Co-PI(s).
          <Form.Item
            name="pi"
            rules={[{ required: true }]}
            className="inner-form-item"
          >
            <UserSelect userRole="pi" maxCount={1} />
          </Form.Item>
        </Form.Item>
        <Form.Item label="Co-Principal Investigators" className="flex-1">
          &nbsp;
          <Form.Item name="coPis" initialValue={[]} className="inner-form-item">
            <UserSelect userRole="co_pi" />
          </Form.Item>
        </Form.Item>
      </div>

      <Form.Item label="Project Members">
        These users can view, edit, curate, and publish.
        <Form.Item
          name="teamMembers"
          initialValue={[]}
          className="inner-form-item"
        >
          <UserSelect userRole="team_member" />
        </Form.Item>
      </Form.Item>

      <Form.Item label="Unregistered Members">
        Add members without a DesignSafe account. These names can be selected as
        authors during the publication process.
        <GuestMembersInput name="guestMembers" />
      </Form.Item>

      {projectType === 'other' && (
        <>
          <Form.Item label="Assign Authorship">
            You can order the authors during the publication process.
            <Form.Item name={['authors']} className="inner-form-item">
              <AuthorSelect projectUsers={watchedUsers} />
            </Form.Item>
          </Form.Item>

          <Form.Item label="Award Info">
            Recommended for funded projects.
            <AwardsInput name="awardNumbers" />
          </Form.Item>

          <Form.Item label="Referenced Data and Software">
            Published data used in the creation of this dataset.
            <ReferencedDataInput name="referencedData" />
          </Form.Item>

          <Form.Item label="Related Work">
            Information giving context, a linked dataset on DesignSafe, or works
            citing the DOI for this dataset.
            <RelatedWorkInput name="relatedWork" />
          </Form.Item>
        </>
      )}

      <Form.Item label="Events">
        Details related to specific events such as natural hazards (ex.
        Hurricane Katrina).
        <HazardEventsInput name="nhEvents" />
      </Form.Item>

      <Form.Item label="Keywords" required>
        Choose informative words that indicate the content of the project.
        <Form.Item name="keywords" className="inner-form-item">
          <Select mode="tags" notFoundContent={null}></Select>
        </Form.Item>
      </Form.Item>

      <Form.Item label="Project Description" required>
        What is this project about? How can data in this project be reused? How
        is this project unique? Who is the audience? Description must be between
        50 and 5000 characters in length.
        <Form.Item
          name="description"
          rules={[{ required: true }, { min: 50 }]}
          className="inner-form-item"
        >
          <Input.TextArea autoSize={{ minRows: 4 }} />
        </Form.Item>
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
};
