import React, { useState, useEffect } from 'react';
import { Button, Form, Input, Select, Badge } from 'antd';
import { FormItem } from 'react-hook-form-antd';
import { useFormContext, useWatch } from 'react-hook-form';
import {
  TFieldOptions,
  tapisInputFileRegex,
  TAppFileSettings,
} from '../AppsWizard/AppsFormSchema';
import { SecondaryButton } from '@client/common-components';
import { SelectModal } from '../SelectModal/SelectModal';
import { useSystemOverview } from '../../../../src/hooks/system-status/useSystemOverview';
import { useSystemQueue } from '../../../../src/hooks/system-status/useSystemQueue';
import systemStatusStyles from '../../../../src/workspace/components/SystemStatusModal/SystemStatusModal.module.css';
import queueStyles from '../../../../src/workspace/components/SystemStatusModal/SystemQueueTable.module.css';

interface QueueItem {
  name: string;
  down: boolean;
  hidden: boolean;
  load: number;
  free: number;
  running: number;
  waiting: number;
}

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

  const { data: systems } = useSystemOverview();
  const selectedSystemId = getValues('configuration.execSystemId');
  const selectedSystem = systems?.find(
    (sys) => sys.display_name.toLowerCase() === selectedSystemId?.toLowerCase()
  );

  const [queueData, setQueueData] = useState<QueueItem[]>([]);
  useEffect(() => {
    if (selectedSystem) {
      useSystemQueue(selectedSystem.display_name.toLowerCase())
        .then((result) => setQueueData(result))
        .catch(() => setQueueData([]));
    }
  }, [selectedSystem]);

  // Attempt to make Stampede3 queue status appear, same async pattern used in useSystemQueuem, currently not working (frontera working fine)...
  /*
const [queueData, setQueueData] = useState<QueueItem[]>([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  if (!selectedSystem) {
    setQueueData([]);
    return;
  }
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await useSystemQueue(selectedSystem.display_name.toLowerCase());
      setQueueData(result);
    } catch (err) {
      console.error("Error fetching queue data:", err);
      setQueueData([]);
    } finally {
      setLoading(false);
    }
  };
  
  fetchData();
}, [selectedSystem]);

*/

  const selectedQueueName = getValues('configuration.execSystemLogicalQueue');
  console.log('QueueData:', queueData, 'SelectedQueueName:', selectedQueueName);

  const selectedQueue = queueData.find((q) => q.name === selectedQueueName);

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
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Select
                {...props}
                value={selectedSystemId}
                disabled={readOnly}
                suffixIcon={readOnly ? null : undefined}
                style={{
                  textAlign: 'left',
                  maxWidth: 150,
                  width: '20%',
                  backgroundColor: readOnly ? '#F4F4F4' : undefined,
                }}
              />

              {selectedSystem && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginLeft: 12,
                  }}
                >
                  <span style={{ marginRight: -5, marginLeft: 8 }}>
                    {selectedSystemId.charAt(0).toUpperCase() +
                      selectedSystemId.slice(1)}{' '}
                    status:
                  </span>
                  <div
                    className={`${systemStatusStyles.statusBadge} ${
                      selectedSystem.is_operational
                        ? systemStatusStyles.open
                        : systemStatusStyles.closed
                    }`}
                    style={{ marginLeft: 12 }}
                  >
                    {selectedSystem.is_operational
                      ? 'Operational'
                      : 'Maintenance'}
                  </div>
                </div>
              )}
            </div>
          ) : name === 'configuration.execSystemLogicalQueue' ? (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Select
                {...props}
                value={selectedQueueName}
                onChange={(value) => {
                  setValue('configuration.execSystemLogicalQueue', value);
                }}
                style={{ textAlign: 'left', maxWidth: 150, width: '20%' }}
              />
              {selectedQueueName &&
                (selectedQueue ? (
                  // If queue is found, show Open/Closed
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginLeft: 12,
                    }}
                  >
                    <span style={{ marginRight: -5, marginLeft: 8 }}>
                      Queue Status:
                    </span>
                    <div
                      className={`${queueStyles.statusBadge} ${
                        selectedQueue.down
                          ? queueStyles.closed
                          : queueStyles.open
                      }`}
                      style={{ marginLeft: 12 }}
                    >
                      {selectedQueue.down ? 'Closed' : 'Open'}
                    </div>
                  </div>
                ) : (
                  // If queue is not found (including empty queueData), show Not Available
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginLeft: 12,
                    }}
                  >
                    <span style={{ marginRight: -5, marginLeft: 8 }}>
                      Queue Status:
                    </span>
                    <div
                      className={`${queueStyles.statusBadge} ${queueStyles.closed}`}
                      style={{ marginLeft: 12 }}
                    >
                      Not Available
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <Select
              {...props}
              value={getValues(name)}
              style={{ textAlign: 'left', maxWidth: 150, width: '20%' }}
            />
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
              style={{ marginRight: '8px', maxWidth: 150, width: '20%' }}
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
