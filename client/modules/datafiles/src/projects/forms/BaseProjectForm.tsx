import { Alert, Button, Form, Input, Popconfirm, Select, Tag } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import {
  TBaseProjectValue,
  useAuthenticatedUser,
  useProjectDetail,
} from '@client/hooks';
import { customRequiredMark } from './_common';
import { AuthorSelect } from './_fields/AuthorSelect';
import { ProjectTypeRadioSelect } from '../modals/ProjectTypeRadioSelect';
import { useKeywordSuggestions } from '../../hooks/useKeywordSuggestions';

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
  projectType?: string;
  onSubmit: (patchMetadata: Record<string, unknown>) => void;
  changeTypeModal?: React.ReactElement;
}> = ({ projectId, projectType, onSubmit, changeTypeModal }) => {
  const [form] = Form.useForm();
  const { data } = useProjectDetail(projectId ?? '');

  const [hasValidationErrors, setHasValidationErrors] = useState(false);

  if (!projectType) {
    projectType = data?.baseProject.value.projectType;
  }

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

  const watchedPi = Form.useWatch(['pi'], form);
  const watchedCoPis = Form.useWatch(['coPis'], form);
  const watchedMembers = Form.useWatch(['teamMembers'], form);
  const watchedGuestMembers = Form.useWatch(['guestMembers'], form);
  const watchedUsers = useMemo(
    () => [
      ...(watchedPi ?? []),
      ...(watchedCoPis ?? []),
      ...(watchedMembers ?? []),
      ...(watchedGuestMembers?.filter(
        (f: TProjectUser) => !!f && f.fname && f.lname && f.email && f.inst
      ) ?? []),
    ],
    [watchedPi, watchedCoPis, watchedMembers, watchedGuestMembers]
  );

  const watchedTitle = Form.useWatch('title', form) ?? '';
  const watchedDescription = Form.useWatch('description', form) ?? '';
  const watchedSelected = Form.useWatch('keywords', form) ?? [];

  const { data: suggestedKeywords = [] } = useKeywordSuggestions(
    watchedTitle,
    watchedDescription
  );
  const availableSuggestions = suggestedKeywords.filter(
    (kw) => !watchedSelected.includes(kw)
  );

  useEffect(() => {
    console.log('Project Title:', watchedTitle);
    console.log('Project Description:', watchedDescription);
    console.log('Suggested Keywords:', suggestedKeywords);
  }, [watchedTitle, watchedDescription, suggestedKeywords]);

  const { user } = useAuthenticatedUser();
  const [showConfirm, setShowConfirm] = useState(false);
  const onFormSubmit = (
    v: Record<string, unknown> & { users: TProjectUser[] }
  ) => {
    setHasValidationErrors(false);
    const currentUserInProject = v.users.find(
      (u) => u.username === user?.username
    );
    if (!currentUserInProject && !showConfirm) {
      setShowConfirm(true);
    } else {
      onSubmit(v);
    }
  };

  if (!data) return <div>Loading</div>;
  return (
    <Form
      scrollToFirstError
      form={form}
      layout="vertical"
      onFinish={(v) => onFormSubmit(processFormData(v))}
      onFinishFailed={() => setHasValidationErrors(true)}
      requiredMark={customRequiredMark}
    >
      <Form.Item label="Project Title" required>
        Incorporate the project's focus with words indicating the hazard, model,
        system, and research approach. Define all acronyms.
        <Form.Item
          name="title"
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

      {/*TODO: disable in situations where project type shouldn't be changed.*/}
      {changeTypeModal && (
        <Form.Item label="Project Type">
          <ProjectTypeInput projectType={data.baseProject.value.projectType} />
          {changeTypeModal}
        </Form.Item>
      )}

      {projectType === 'field_recon' && (
        <Form.Item label="Field Research Type" required>
          Specify the Field Research being performed. Enter a custom value by
          typing it into the field and pressing "return".
          <Form.Item
            name="frTypes"
            className="inner-form-item"
            rules={[
              {
                required: true,
                message: 'Please select/enter a field research type', // Custom error message
              },
            ]}
          >
            <DropdownSelect options={frTypeOptions} />
          </Form.Item>
        </Form.Item>
      )}

      {projectType !== 'None' && (
        <Form.Item label="Natural Hazard Types" required>
          Specify the natural hazard being researched. Enter a custom value by
          typing it into the field and pressing "return".
          <Form.Item
            name="nhTypes"
            className="inner-form-item"
            rules={[
              {
                required: true,
                message: 'Please select/enter a natural hazard type', // Custom error message
              },
            ]}
          >
            <DropdownSelect options={nhTypeOptions} />
          </Form.Item>
        </Form.Item>
      )}

      {projectType === 'other' && (
        <>
          <Form.Item label="Data Types" required>
            The nature or genre of the content. Enter a custom value by typing
            it into the field and pressing "return".
            <Form.Item
              className="inner-form-item"
              name="dataTypes"
              rules={[
                {
                  required: true,
                  message: 'Please select/enter a data type', // Custom error message
                },
              ]}
            >
              <DropdownSelect options={dataTypeOptions} />
            </Form.Item>
          </Form.Item>

          <Form.Item label="Facilities">
            Specify the facilities involved in this research. Enter a custom
            value by typing it into the field and pressing "return".
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
        <Form.Item
          label="Principal Investigator"
          required
          className="flex-1"
          style={{ overflow: 'hidden' }}
        >
          These users can view, edit, curate, and publish. Include Co-PI(s).
          Users can be looked up using their <strong>exact username</strong>{' '}
          only.
          <Form.Item
            name="pi"
            rules={[
              {
                required: true,
                message: 'Please enter the Principal Investigator', // Custom error message
              },
            ]}
            className="inner-form-item"
          >
            <UserSelect
              userRole="pi"
              maxCount={1}
              existingUsers={watchedUsers}
            />
          </Form.Item>
        </Form.Item>
        <Form.Item
          label="Co-Principal Investigators"
          className="flex-1"
          style={{ overflow: 'hidden' }}
        >
          <br />
          <br />
          <Form.Item name="coPis" initialValue={[]} className="inner-form-item">
            <UserSelect userRole="co_pi" existingUsers={watchedUsers} />
          </Form.Item>
        </Form.Item>
      </div>

      <Form.Item label="Project Members">
        These users can view, edit, curate, and publish. Users can be looked up
        using their <strong>exact username</strong> only.
        <Form.Item
          name="teamMembers"
          initialValue={[]}
          className="inner-form-item"
        >
          <UserSelect userRole="team_member" existingUsers={watchedUsers} />
        </Form.Item>
      </Form.Item>

      <Form.Item label="Unregistered Members">
        Add members without a DesignSafe account. These names can be selected as
        authors during the publication process.
        <GuestMembersInput name="guestMembers" />
      </Form.Item>

      {projectType === 'other' && (
        <>
          <Form.Item label="Assign Authorship" required>
            You can order the authors during the publication process.
            <Form.Item
              name={['authors']}
              rules={[
                {
                  required: true,
                  message: 'Please select at least one author.',
                },
              ]}
              className="inner-form-item"
            >
              <AuthorSelect
                projectUsers={watchedUsers}
                currentAuthors={data?.baseProject.value.authors ?? []}
              />
            </Form.Item>
          </Form.Item>

          <Form.Item label="Referenced Data and Software">
            Published data used in the creation of this dataset.
            <ReferencedDataInput name="referencedData" />
          </Form.Item>

          <Form.Item label="Related Work">
            Information giving context, a linked dataset on DesignSafe, or works
            citing the DOI for this dataset.
            <RelatedWorkInput name="associatedProjects" />
          </Form.Item>
        </>
      )}

      <Form.Item label="Award Info">
        Recommended for funded projects.
        <AwardsInput name="awardNumbers" />
      </Form.Item>

      <Form.Item label="Events">
        Details related to specific events such as natural hazards (ex.
        Hurricane Katrina).
        <HazardEventsInput name="nhEvents" />
      </Form.Item>

      {projectType !== 'None' && (
        <Form.Item label="Keywords" required>
          Choose informative words that indicate the content of the project.
          Keywords should be comma-separated.
          <Form.Item
            name="keywords"
            rules={[{ required: true }]}
            className="inner-form-item"
          >
            <Select
              mode="tags"
              notFoundContent={null}
              tokenSeparators={[',']}
            ></Select>
          </Form.Item>
          {availableSuggestions.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <p>Suggested Keywords:</p>
              {availableSuggestions.map((kw) => (
                <Tag
                  key={kw}
                  color="blue"
                  style={{ cursor: 'pointer', marginBottom: 4 }}
                  onClick={() => {
                    form.setFieldValue('keywords', [...watchedSelected, kw]);
                  }}
                >
                  {kw}
                </Tag>
              ))}
            </div>
          )}
        </Form.Item>
      )}
      <Form.Item label="Project Description" required>
        What is this project about? How can data in this project be reused? How
        is this project unique? Who is the audience? Description must be between
        50 and 5000 characters in length.
        <Form.Item
          name="description"
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
          className="inner-form-item"
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
      <Form.Item>
        <Popconfirm
          title="Confirm Update"
          description={
            <div id="desc">
              If you save this project without adding yourself as a principal
              investigator
              <br /> or team member, you will lose access to the project and its
              files.
            </div>
          }
          open={showConfirm}
          okText="Proceed"
          placement="topRight"
          afterOpenChange={(isOpen) => {
            if (isOpen) {
              // Focus on opening so that the popover is accessible via keyboard
              document.getElementById('prj-confirm-cancel')?.focus();
            }
          }}
          cancelButtonProps={{ id: 'prj-confirm-cancel' }}
          onOpenChange={(newVal) => {
            if (!newVal) setShowConfirm(newVal);
          }}
          onConfirm={() => onSubmit(processFormData(form.getFieldsValue()))}
        >
          <Button type="primary" htmlType="submit" style={{ float: 'right' }}>
            Update Project
          </Button>
        </Popconfirm>
      </Form.Item>
    </Form>
  );
};
