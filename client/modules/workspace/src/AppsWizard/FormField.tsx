import React, { useState, useEffect } from 'react';
import { Button, Form, Input, Select } from 'antd';
import { FormItem } from 'react-hook-form-antd';
import { useFormContext, useWatch } from 'react-hook-form';
import {
  TFieldOptions,
  tapisInputFileRegex,
  TAppFileSettings,
} from '../AppsWizard/AppsFormSchema';
import { getSystemDisplayName } from '../utils';
import { SecondaryButton } from '@client/common-components';
import { SelectModal } from '../SelectModal/SelectModal';
import { SystemsDocumentation } from './SystemsDocumentation';
import { useSystemOverview, useSystemQueue } from '@client/hooks';
import systemStatusStyles from '../components/SystemStatusModal/SystemStatusModal.module.css';
import queueStyles from '../components/SystemStatusModal/SystemQueueTable.module.css';

const ExtendedSelect: React.FC<{
  after?: React.FC<{
    name: string;
    value: string;
  }>;
  name: string;
  value: string;
  style?: React.CSSProperties;
  [key: string]: unknown;
}> = ({ after: After, name, value, style = {}, ...props }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <Select
        {...props}
        value={value}
        style={{
          textAlign: 'left',
          width: 'auto',
          minWidth: '150px',
          ...style,
        }}
      />
      {After && <After name={name} value={value} />}
    </div>
  );
};

const SystemStatus: React.FC<{
  value: string;
}> = ({ value }) => {
  const { data: systems } = useSystemOverview();
  const displayName = getSystemDisplayName(value);
  const selectedSystem = systems?.find(
    (sys) => sys.display_name === displayName
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', marginLeft: 12 }}>
      <span style={{ marginRight: -5, marginLeft: 8 }}>
        {value.charAt(0).toUpperCase() + value.slice(1)} status:
      </span>
      <div
        className={`${systemStatusStyles.statusBadge} ${
          selectedSystem?.is_operational
            ? systemStatusStyles.open
            : systemStatusStyles.closed
        }`}
        style={{ marginLeft: 12 }}
      >
        {selectedSystem?.is_operational ? 'Operational' : 'Maintenance'}
      </div>
    </div>
  );
};

const QueueStatus: React.FC<{
  value: string;
}> = ({ value }) => {
  const { getValues } = useFormContext();
  const selectedSystemId = getValues('configuration.execSystemId');
  const displayName = getSystemDisplayName(selectedSystemId);
  const { data: queueData } = useSystemQueue(displayName);
  const selectedQueue = queueData?.find((q) => q.name === value);

  if (!value) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', marginLeft: 12 }}>
      <span style={{ marginRight: -5, marginLeft: 8 }}>Queue Status:</span>
      <div
        className={`${queueStyles.statusBadge} ${
          selectedQueue
            ? selectedQueue.down
              ? queueStyles.closed
              : queueStyles.open
            : queueStyles.closed
        }`}
        style={{ marginLeft: 12 }}
      >
        {selectedQueue
          ? selectedQueue.down
            ? 'Closed'
            : 'Open'
          : 'Not Available'}
      </div>
    </div>
  );
};

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
  readOnly?: boolean;
}> = ({
  name,
  parameterSet = null,
  description,
  label,
  required = false,
  type,
  fileSettings = null,
  readOnly = false,
  ...props
}) => {
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
          name === 'configuration.execSystemId' ? (
            <ExtendedSelect
              {...props}
              name={name}
              value={getValues(name)}
              disabled={readOnly}
              suffixIcon={readOnly ? null : undefined}
              after={SystemStatus}
            />
          ) : name === 'configuration.execSystemLogicalQueue' ? (
            <ExtendedSelect
              {...props}
              name={name}
              value={getValues(name)}
              onChange={(value: string) => {
                setValue('configuration.execSystemLogicalQueue', value);
              }}
              after={QueueStatus}
            />
          ) : (
            <ExtendedSelect {...props} name={name} value={getValues(name)} />
          )
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
              style={{ marginRight: '8px', width: '100%' }}
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
      {name === 'configuration.execSystemLogicalQueue' && (
        <SystemsDocumentation
          execSystemId={getValues('configuration.execSystemId')}
        />
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
