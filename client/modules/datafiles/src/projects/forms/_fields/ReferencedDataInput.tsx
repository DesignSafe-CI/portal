import { Button, Form, Input, Radio } from 'antd';
import React from 'react';

export const ReferencedDataInput: React.FC<{ name: string }> = ({ name }) => {
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
                  label="Title"
                  name={disabled ? undefined : [name, 'title']}
                  className="flex-1"
                >
                  <Input disabled={disabled} />
                </Form.Item>

                <div style={{ width: '40%' }}>
                  <Form.Item
                    rules={[{ required: !disabled }]}
                    label="URL or DOI, in URL format"
                    name={disabled ? undefined : [name, 'doi']}
                    style={{ marginBottom: 0 }}
                  >
                    <Input placeholder="https://" disabled={disabled} />
                  </Form.Item>

                  <Form.Item
                    rules={[
                      {
                        required: !disabled,
                        message: 'Please specify the URL type',
                      },
                    ]}
                    name={disabled ? undefined : [name, 'hrefType']}
                    className="inner-form-item"
                  >
                    <Radio.Group disabled={disabled}>
                      <Radio value="doi">DOI</Radio>
                      <Radio value="url">URL</Radio>
                    </Radio.Group>
                  </Form.Item>
                </div>

                <Form.Item hidden={disabled} label="&nbsp;">
                  <Button
                    type="primary"
                    danger
                    onClick={() => remove(name)}
                    aria-label="Remove Referenced Data"
                  >
                    <i role="none" className="fa fa-times"></i>
                  </Button>
                </Form.Item>
              </div>
            );
          })}
          <Button type="default" onClick={() => add()} block icon={'+'}>
            Add Referenced Data
          </Button>
        </>
      )}
    </Form.List>
  );
};
