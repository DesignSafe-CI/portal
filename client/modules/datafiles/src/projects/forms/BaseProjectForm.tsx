import { Button, Form, Input, Select, Tag } from 'antd';
import React from 'react';
import {
  nhTypeOptions,
  facilityOptions,
  dataTypeOptions,
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

const customizeRequiredMark = (
  label: React.ReactNode,
  info: { required: boolean }
) => (
  <>
    <span style={{ whiteSpace: 'nowrap' }}>{label}</span>&nbsp;
    {info.required && (
      <Tag
        color="#d9534f"
        style={{
          borderRadius: '2.7px',
          lineHeight: 1,
          paddingInline: 0,
          padding: '0.2em 0.4em 0.3em',
          fontSize: '75%',
        }}
      >
        Required
      </Tag>
    )}
  </>
);

export const BaseProjectForm: React.FC<{ projectId: string }> = ({
  projectId,
}) => {
  const [form] = Form.useForm();
  const { data } = useProjectDetail(projectId ?? '');

  function processFormData(formData: Record<string, TProjectUser[]>) {
    const { pi, coPis, teamMembers, guestMembers, ...rest } = formData;
    return {
      ...rest,
      users: [...pi, ...coPis, ...teamMembers, ...guestMembers],
    };
  }

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

  //const watchedItem = Form.useWatch([], form);
  if (!data) return <div>Loading</div>;
  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={(v) => console.log(processFormData(v))}
      onFinishFailed={(v) => console.log(processFormData(v.values))}
      requiredMark={customizeRequiredMark}
    >
      <Button
        onClick={() =>
          form.setFieldsValue(cleanInitialvalues(data.baseProject.value))
        }
      >
        Set form
      </Button>
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
