import React from 'react';
import { Button, Form, Input, Select } from 'antd';
import { FormItem } from 'react-hook-form-antd';
import { useFormContext, useWatch } from 'react-hook-form';
import { TFieldOptions } from '../AppsWizard/AppsFormSchema';
import { SecondaryButton } from '@client/common-components';

export const FormField: React.FC<{
  name: string;
  tapisFile?: boolean;
  parameterSet?: string;
  description?: string;
  label: string;
  required?: boolean;
  type: string;
  placeholder?: string;
  options?: TFieldOptions[];
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
  const { resetField, control, getValues } = useFormContext();
  const fieldState = useWatch({ control, name });
  let parameterSetLabel: React.ReactElement | null = null;

  if (parameterSet) {
    parameterSetLabel = (
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
    );
  }

  return (
    <div style={{ lineHeight: '20px' }}>
      <FormItem
        control={control}
        name={name}
        required={required}
        label={
          <span>
            {label}
            {parameterSetLabel}
          </span>
        }
        htmlFor={name}
        key={name}
        style={{ textAlign: 'left', marginBottom: description ? 0 : 16 }}
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
          <Select
            {...props}
            value={getValues(name)}
            style={{ textAlign: 'left' }}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {tapisFile && (
              <Form.Item name="prefix" noStyle>
                <SecondaryButton>Select</SecondaryButton>
              </Form.Item>
            )}
            <Input
              {...props}
              type={type}
              value={getValues(name)}
              style={{ marginRight: '8px' }}
            />
            <Button
              type="link"
              onClick={() => resetField(name, { defaultValue: '' })}
              disabled={!fieldState}
            >
              Clear
            </Button>
          </div>
        )}
      </FormItem>
      {description && (
        <small
          style={{
            display: 'block',
            textAlign: 'left',
            font: 'italic normal normal 12px/16px Helvetica Neue',
            letterSpacing: '0px',
            color: '#707070',
            opacity: 1,
            marginBottom: 16,
          }}
        >
          {description}
        </small>
      )}
    </div>
  );
};
