import { Button, Form, Input } from 'antd';
import React from 'react';

export const GuestMembersInput: React.FC<{ name: string }> = ({ name }) => {
  return (
    <Form.List name={name} initialValue={[]}>
      {(fields, { add, remove }) => (
        <>
          {[
            ...(fields.length === 0 ? [{ key: -1, name: -1 }] : []), //Pad the fields when empty to display a placeholder.
            ...fields,
          ].map(({ key, name }) => {
            const disabled = fields.length === 0;
            return (
              <div
                style={{ display: 'flex', flexDirection: 'column' }}
                key={key}
              >
                <div
                  style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}
                >
                  <Form.Item
                    rules={[{ required: !disabled }]}
                    label="First Name"
                    name={disabled ? undefined : [name, 'fname']}
                    className="flex-1"
                  >
                    <Input disabled={disabled} />
                  </Form.Item>
                  <Form.Item
                    rules={[{ required: !disabled }]}
                    label="Last Name"
                    name={disabled ? undefined : [name, 'lname']}
                    className="flex-1"
                  >
                    <Input disabled={disabled} />
                  </Form.Item>
                  <Form.Item
                    rules={disabled ? undefined : [{ required: !disabled }]}
                    label="Email"
                    name={[name, 'email']}
                    className="flex-1"
                  >
                    <Input disabled={disabled} />
                  </Form.Item>
                </div>
                <div
                  style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}
                >
                  <Form.Item
                    rules={[{ required: !disabled }]}
                    label="Institution"
                    name={disabled ? undefined : [name, 'inst']}
                    className="flex-2"
                  >
                    <Input disabled={disabled} />
                  </Form.Item>
                  <Form.Item
                    label="ORCID ID"
                    name={disabled ? undefined : [name, 'orcidId']}
                    className="flex-2"
                  >
                    <Input disabled={disabled} />
                  </Form.Item>
                  <Form.Item
                    hidden
                    name={disabled ? undefined : [name, 'role']}
                    initialValue="guest"
                  >
                    <Input hidden />
                  </Form.Item>
                  <Form.Item label="&nbsp;" hidden={disabled}>
                    <Button
                      type="primary"
                      danger
                      onClick={() => remove(name)}
                      aria-label="Remove Guest Member"
                    >
                      <i role="none" className="fa fa-times"></i>
                    </Button>
                  </Form.Item>
                </div>
              </div>
            );
          })}
          <Button type="default" onClick={() => add()} block icon={'+'}>
            Add Guest Member
          </Button>
        </>
      )}
    </Form.List>
  );
};
