import { Button, Form, Input } from 'antd';
import React from 'react';

export const AwardsInput: React.FC<{ name: string }> = ({ name }) => {
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
              <div style={{ display: 'flex', gap: '1rem' }} key={key}>
                <Form.Item
                  rules={[{ required: !disabled }]}
                  label="Award Name"
                  name={disabled ? undefined : [name, 'name']}
                  className="flex-1"
                >
                  <Input disabled={disabled} />
                </Form.Item>
                <Form.Item
                  rules={[{ required: !disabled }]}
                  label="Award Number"
                  name={disabled ? undefined : [name, 'number']}
                  className="flex-1"
                >
                  <Input disabled={disabled} />
                </Form.Item>
                <Form.Item
                  rules={[{ required: !disabled }]}
                  label="Funding Source"
                  name={disabled ? undefined : [name, 'fundingSource']}
                  className="flex-1"
                >
                  <Input disabled={disabled} />
                </Form.Item>
                <Form.Item label="&nbsp;" hidden={disabled}>
                  <Button
                    type="primary"
                    danger
                    onClick={() => remove(name)}
                    aria-label="Remove Award"
                  >
                    <i role="none" className="fa fa-times"></i>
                  </Button>
                </Form.Item>
              </div>
            );
          })}
          <Button type="default" onClick={() => add()} block icon={'+'}>
            Add Award
          </Button>
        </>
      )}
    </Form.List>
  );
};
