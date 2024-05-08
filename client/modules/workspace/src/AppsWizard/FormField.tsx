import React, { PropsWithoutRef } from 'react';
import { Button, Form, Input, Select } from 'antd';
import { FormItem } from 'react-hook-form-antd';
import { useFormContext, useWatch } from 'react-hook-form';

export const FormField: React.FC<{
  name: string;
  tapisFile?: boolean;
  parameterSet?: string;
  description?: string;
  label: string;
  required?: boolean;
  type: string;
  placeholder?: string;
  options?: any[];
}> = ({
  name,
  tapisFile = false,
  parameterSet = null,
  description,
  label,
  required = false,
  type,
  ...props
}) => {
  const { resetField, control } = useFormContext();
  const fieldState = useWatch({ control, name });

  return (
    <div style={{ lineHeight: '20px' }}>
      {parameterSet && (
        <code>
          (
          <a
            href={`https://tapis.readthedocs.io/en/latest/technical/jobs.html#${parameterSet.toLowerCase()}`}
            target="_blank"
            rel="noreferrer"
          >
            {parameterSet}
          </a>
          )
        </code>
      )}
      <FormItem
        control={control}
        name={name}
        required={required}
        label={label}
        htmlFor={name}
        key={name}
      >
        {/* <SelectModal
                  isOpen={openTapisFileModal}
                  toggle={() => {
                    setOpenTapisFileModal((prevState) => !prevState);
                  }}
                  onSelect={(system, path) => {
                    helpers.setValue(`tapis://${system}/${path}`);
                  }}
                /> */}
        {type === 'select' ? (
          <Select {...props} />
        ) : (
          <Input
            {...props}
            type={type}
            addonBefore={
              tapisFile && (
                <Form.Item name="prefix" noStyle>
                  <Button
                    type="primary"
                    // onClick={() => setOpenTapisFileModal(true)}
                  >
                    Select
                  </Button>
                </Form.Item>
              )
            }
            addonAfter={
              <Button
                type="text"
                onClick={() => resetField(name, { defaultValue: '' })}
                disabled={!fieldState}
              >
                Clear
              </Button>
            }
          />
        )}
      </FormItem>
      {description && (
        <small style={{ lineHeight: '20px' }}>{description}</small>
      )}
    </div>
  );
};
