import { Button, Form, Input } from 'antd';
import React, { useEffect } from 'react';

import { UserSelect, GuestMembersInput } from './_fields';
import { TProjectUser } from './_fields/UserSelect';
import { customRequiredMark } from './_common';
import { useAuthenticatedUser } from '@client/hooks';

export const BaseProjectCreateForm: React.FC<{
  onSubmit: (value: Record<string, unknown>) => void;
}> = ({ onSubmit }) => {
  const [form] = Form.useForm();

  function processFormData(formData: Record<string, TProjectUser[]>) {
    const { pi, coPis, teamMembers, guestMembers, ...rest } = formData;
    return {
      ...rest,
      users: [...pi, ...coPis, ...teamMembers, ...guestMembers],
    };
  }
  const { user } = useAuthenticatedUser();

  /* pre-populate form with logged-in user as PI. */
  useEffect(() => {
    form.setFieldValue('pi', [
      {
        fname: user?.firstName,
        lname: user?.lastName,
        username: user?.username,
        email: user?.email,
        inst: user?.institution,
        role: 'pi',
      },
    ]);
  }, [form, user]);

  if (!user) return null;
  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={(v) => onSubmit(processFormData(v))}
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

      <div style={{ display: 'flex', gap: '1rem' }}>
        <Form.Item label="Principal Investigator" required className="flex-1">
          These users can view, edit, curate, and publish. Include Co-PI(s).
          <Form.Item
            name="pi"
            rules={[{ required: true }]}
            className="inner-form-item"
          >
            <UserSelect userRole="pi" maxCount={1} disabled />
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
