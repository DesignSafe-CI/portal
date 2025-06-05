import React, { useState, useEffect } from 'react';
import { Button, Form, Input, Select } from 'antd';
import { FormItem } from 'react-hook-form-antd';
import { useFormContext, useWatch } from 'react-hook-form';
import {
  TFieldOptions,
  tapisInputFileRegex,
  TAppFileSettings,
} from '../AppsWizard/AppsFormSchema';
import { SecondaryButton } from '@client/common-components';
import { SelectModal } from '../SelectModal/SelectModal';

export const FormField: React.FC<{
  name: string;
  parameterSet?: string;
  description?: string;
  label: string;
  required?: boolean;
  type: string;
  fileSettings?: TAppFileSettings;
  placeholder?: string;
  options?: TFieldOptions[];
}> = ({
  name,
  parameterSet = null,
  description,
  label,
  required = false,
  type,
  fileSettings = null,
  ...props
}) => {
  // console.log('????');
  // console.log(FormField);
  const { resetField, control, getValues, setValue, trigger } =
    useFormContext();
  const fieldState = useWatch({ control, name });
  let parameterSetLabel: React.ReactElement | null = null;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [storageSystem, setStorageSystem] = useState<string | null>(null);

  const handleSelectModalOpen = () => {
    setIsModalOpen(true);
  };
  useEffect(() => {
    setStorageSystem(null);

    if (fileSettings?.fileNameRepresentation === 'FullTapisPath') {
      const inputFileValue = getValues(name);
      const match = inputFileValue?.match(tapisInputFileRegex);

      if (match?.groups) {
        setStorageSystem(match.groups.storageSystem);
      }
    }
  }, [fileSettings, name, fieldState]);

  if (parameterSet) {
    parameterSetLabel = (
      <code style={{ marginLeft: 5 }}>
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
          <span style={{ marginBottom: 10 }}>
            {label} {parameterSetLabel}
          </span>
        }
        htmlFor={name}
        key={name}
        style={{ textAlign: 'left', marginBottom: description ? 0 : 16 }}
      >
        {type === 'select' ? (
          <Select
            {...props}
            value={getValues(name)}
            style={{ textAlign: 'left' }}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {fileSettings && (
              <Form.Item name="prefix" noStyle>
                <SecondaryButton onClick={handleSelectModalOpen}>
                  Select
                </SecondaryButton>
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
              style={{ fontWeight: 'bold' }}
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
            font: 'italic normal normal 14px/16px Helvetica Neue',
            letterSpacing: '0px',
            color: '#707070',
            opacity: 1,
            marginBottom: 16,
            marginTop: 10,
            lineHeight: 1.5,
          }}
        >
          {description}
        </small>
      )}
      {/* Select Modal has Form and input which cause state sharing with above FormItem
          So, SelectModal is outside FormItem.
       */}
      {fileSettings && (
        <SelectModal
          inputLabel={label}
          system={storageSystem}
          appFileSettings={fileSettings}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelect={(value: string) => {
            setValue(name, value);
            trigger(name);
          }}
        />
      )}
    </div>
  );
};
