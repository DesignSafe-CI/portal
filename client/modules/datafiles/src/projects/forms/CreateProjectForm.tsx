import { Button, Form, Input } from 'antd';
import React, { useEffect, useMemo } from 'react';

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

  if (!user) return null;
  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={(v) => {
        onSubmit(processFormData(v));
        form.resetFields();
      }}
      onFinishFailed={(v) => console.log(processFormData(v.values))}
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
            <UserSelect userRole="pi" maxCount={1} disabled />
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
        These users can view, edit, curate, and publish.
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

      <Form.Item label="Project Description" required>
        What is this project about? How can data in this project be reused? How
        is this project unique? Who is the audience? Description must be between
        50 and 5000 characters in length. (
        <a href="/user-guide/curating/bestpractices/#project-level-descriptions">
          Learn how to write descriptions.
        </a>
        )
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

      <Form.Item>
        <Button type="primary" htmlType="submit">
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
};
