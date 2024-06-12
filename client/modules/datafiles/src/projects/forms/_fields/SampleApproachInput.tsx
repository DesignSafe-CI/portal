import { Button, Form, Input } from 'antd';
import React from 'react';

export const SampleApproachInput: React.FC<{ name: string | string[] }> = ({
  name,
}) => {
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
                  name={disabled ? undefined : [name]}
                  className="flex-1"
                >
                  <Input disabled={disabled} />
                </Form.Item>
                <Button
                  type="primary"
                  hidden={disabled}
                  danger
                  onClick={() => remove(name)}
                  aria-label="Remove Sampling Approach"
                >
                  <i role="none" className="fa fa-times"></i>
                </Button>
              </div>
            );
          })}
          <Button type="default" onClick={() => add()} block icon={'+'}>
            Add Sampling Approach
          </Button>
        </>
      )}
    </Form.List>
  );
};
